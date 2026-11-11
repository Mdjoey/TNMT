import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, MapPin, ExternalLink, Search, RotateCcw, Store, Sparkles } from 'lucide-react';

export default function FarmList() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Tất cả');
  const navigate = useNavigate();

  // Nút quay lại thông minh
  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    setLoading(true);
    axios
      .get('/api/farms/')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setFarms(data);
      })
      .catch((err) => {
        console.error('Lỗi tải danh sách nhà vườn:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Danh sách các vùng miền phổ biến để lọc nhanh
  const regions = ['Tất cả', 'Đà Lạt', 'Mộc Châu', 'Củ Chi'];

  // Lọc danh sách theo từ khóa tìm kiếm & khu vực
  const filteredFarms = useMemo(() => {
    return farms.filter((f) => {
      const name = (f.name || '').toLowerCase();
      const address = (f.address || '').toLowerCase();
      const certId = (f.vietgap_cert_id || '').toLowerCase();
      const term = searchTerm.trim().toLowerCase();

      const matchSearch =
        name.includes(term) || address.includes(term) || certId.includes(term);

      const matchRegion =
        selectedRegion === 'Tất cả' ||
        address.includes(selectedRegion.toLowerCase()) ||
        name.includes(selectedRegion.toLowerCase());

      return matchSearch && matchRegion;
    });
  }, [farms, searchTerm, selectedRegion]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 font-sans space-y-6">
      {/* Nút quay lại thông minh */}
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-emerald-700 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>

      {/* Header tiêu đề */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Mạng lưới nhà vườn sinh thái VietGAP
          </h1>
          <p className="text-gray-500 text-xs mt-1">
            Các đối tác nông hộ liên kết trực tiếp trên hệ thống truy xuất nguồn gốc EcoTrace
          </p>
        </div>
      </div>

      {/* THANH TÌM KIẾM & BỘ LỌC VÙNG MIỀN */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          {/* Ô nhập tìm kiếm */}
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên nhà vườn, tỉnh thành hoặc mã VietGAP (VD: Mộc Châu, VG-...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>

          {/* Nút reset tìm kiếm nếu có nhập */}
          {(searchTerm || selectedRegion !== 'Tất cả') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedRegion('Tất cả');
              }}
              className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-red-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Đặt lại
            </button>
          )}
        </div>

        {/* Thẻ lọc theo vùng miền nhanh */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-50 flex-wrap text-xs">
          <span className="text-gray-400 font-medium mr-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> Khu vực:
          </span>
          {regions.map((reg) => (
            <button
              key={reg}
              type="button"
              onClick={() => setSelectedRegion(reg)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer text-xs ${
                selectedRegion === reg
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* Hiển thị số lượng tìm được */}
      <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
        <span>
          Hiển thị <b className="text-gray-700">{filteredFarms.length}</b> nhà vườn
          {searchTerm && <span> cho từ khóa "{searchTerm}"</span>}
        </span>
      </div>

      {/* DANH SÁCH NHÀ VƯỜN */}
      {loading ? (
        <div className="text-center py-20 text-gray-400 text-xs font-medium">
          Đang tải danh sách nhà vườn...
        </div>
      ) : filteredFarms.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-6 space-y-3">
          <Store className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-xs text-gray-500 font-medium">
            Không tìm thấy nhà vườn nào phù hợp với tiêu chí tìm kiếm.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedRegion('Tất cả');
            }}
            className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
          >
            Xóa bộ lọc để xem tất cả
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredFarms.map((f) => {
            const count = f.products_count ?? (f.products?.length || 0);
            const farmIdentifier = f.slug || f.id;

            return (
              <div
                key={f.id}
                onClick={() => navigate(`/farm/${farmIdentifier}`)}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs hover:shadow-md transition flex flex-col justify-between group cursor-pointer space-y-4"
              >
                <div>
                  {/* Mã chứng nhận & Icon đại diện */}
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm shadow-xs">
                      {f.name ? f.name[0] : 'N'}
                    </div>

                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100/60 px-2.5 py-1 rounded-full">
                      Mã: {f.vietgap_cert_id || 'VG-VIETGAP'}
                    </span>
                  </div>

                  {/* Tên nhà vườn */}
                  <h3 className="text-base font-bold text-gray-900 mt-4 group-hover:text-emerald-700 transition">
                    {f.name}
                  </h3>

                  {/* Giới thiệu tóm tắt */}
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {f.description ||
                      'Nông trại sinh thái đạt chuẩn VietGAP & GlobalGAP, áp dụng công nghệ giám sát IoT.'}
                  </p>

                  {/* Địa chỉ */}
                  <div className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-3">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{f.address || 'Đà Lạt, Lâm Đồng'}</span>
                  </div>
                </div>

                {/* Footer thẻ: Số lượng sản phẩm & Nút xem */}
                <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-600">
                    <b className="text-emerald-700 font-bold">{count}</b> sản phẩm
                  </span>

                  <span className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1">
                    Xem chi tiết <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}