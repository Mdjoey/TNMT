import React, { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  MapPin,
  ShieldCheck,
  ArrowLeft,
  ShoppingCart,
  ArrowUpRight,
  Camera,
  User,
  Calendar,
  Award,
  Plus,
  Minus,
} from "lucide-react";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";

// Hàm xử lý đường dẫn ảnh tương đối để đi qua Vite proxy
const cleanMediaUrl = (
  url,
  fallback = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=80"
) => {
  if (!url) return fallback;
  let clean = String(url).trim().replace(/[\*\)\"\'\s]+$/, "");
  clean = clean.replace(/^http:\/\/(localhost|127\.0\.0\.1):8000/, "");
  return clean || fallback;
};

export default function FarmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { cartItems, addToCart, updateQuantity } = useContext(CartContext);
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingCover, setUploadingCover] = useState(false);

  // State lưu quy cách được chọn cho từng sản phẩm: { [productId]: variantObject }
  const [selectedVariants, setSelectedVariants] = useState({});

  // Nút quay lại thông minh
  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/farms");
    }
  };

  // Sinh danh sách quy cách đóng gói tương tự ProductList
  const getVariantsForProduct = (product) => {
    if (product.variants && product.variants.length > 0) {
      return product.variants;
    }
    const unit = (product.unit || "kg").trim().toLowerCase();
    const basePrice = Number(product.price || 0);

    if (["hộp", "khay", "túi", "trái", "quả", "bắp", "bó", "chùm"].includes(unit)) {
      return [
        { name: `1 ${product.unit} (Lẻ)`, multiplier_kg: 1, price: basePrice },
        { name: `Combo 3 ${product.unit}`, multiplier_kg: 3, price: Math.round(basePrice * 2.9) },
        { name: `Combo 5 ${product.unit}`, multiplier_kg: 5, price: Math.round(basePrice * 4.7) },
        { name: `Thùng 10 ${product.unit}`, multiplier_kg: 10, price: Math.round(basePrice * 9.0) },
      ];
    } else if (unit === "g") {
      return [
        { name: "Gói 100g (Dùng thử)", multiplier_kg: 100, price: Math.round(basePrice * 100) },
        { name: "Gói 250g (Tiêu chuẩn)", multiplier_kg: 250, price: Math.round(basePrice * 250) },
        { name: "Gói 500g (Tiết kiệm)", multiplier_kg: 500, price: Math.round(basePrice * 480) },
        { name: "Hộp 1.000g (1 kg)", multiplier_kg: 1000, price: Math.round(basePrice * 920) },
      ];
    }
    return [
      { name: "Gói 500g (Dùng thử)", multiplier_kg: 0.5, price: Math.round(basePrice * 0.55) },
      { name: "Túi 1 kg (Tiêu chuẩn)", multiplier_kg: 1.0, price: basePrice },
      { name: "Combo 3 kg (Gia đình)", multiplier_kg: 3.0, price: Math.round(basePrice * 2.85) },
      { name: "Thùng 5 kg (Tiết kiệm)", multiplier_kg: 5.0, price: Math.round(basePrice * 4.6) },
    ];
  };

  const loadFarmDetail = () => {
    setLoading(true);
    const token = localStorage.getItem("ecotrace_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    axios
      .get(`/api/farms/${id}/`, { headers })
      .then((res) => {
        const farmData = res.data;
        setFarm(farmData);

        // Khởi tạo quy cách mặc định cho từng nông sản trong farm
        const initialVariants = {};
        (farmData.products || []).forEach((p) => {
          const variants = getVariantsForProduct(p);
          initialVariants[p.id] = variants[0];
        });
        setSelectedVariants(initialVariants);
      })
      .catch((err) => {
        console.error("Lỗi tải thông tin trang trại:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFarmDetail();
  }, [id]);

  // Kiểm tra quyền: Chỉ chủ sở hữu thực sự của nhà vườn mới có quyền đổi ảnh bìa
  const isActualOwner = Boolean(
    user &&
    farm &&
    (
      farm.is_owner === true ||
      (farm.owner && (user.id === farm.owner || user.id === farm.owner?.id)) ||
      (farm.owner_name && user.username === farm.owner_name)
    )
  );

  // Đổi ảnh bìa trang trại
  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isActualOwner) {
      alert("Bạn không có quyền thay đổi ảnh bìa của trang trại này!");
      return;
    }

    const formData = new FormData();
    formData.append("cover_image", file);

    const token = localStorage.getItem("ecotrace_token");
    setUploadingCover(true);

    try {
      const res = await axios.patch(`/api/farms/${id}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Đã cập nhật ảnh bìa trang trại thành công!");
      setFarm((prev) => ({ ...prev, cover_image: res.data.cover_image }));
    } catch (err) {
      alert(err.response?.data?.detail || "Không thể cập nhật ảnh bìa. Vui lòng thử lại!");
    } finally {
      setUploadingCover(false);
    }
  };

  // Tìm sản phẩm trong giỏ tương ứng với quy cách đang chọn
  const getCartItem = (product) => {
    const currentVariant = selectedVariants[product.id];
    const targetVariantName = currentVariant?.name || "";
    return (cartItems || []).find(
      (item) =>
        item.id === product.id &&
        (item.variant_name === targetVariantName || !item.variant_name)
    );
  };

  // Thêm vào giỏ hàng
  const handleAddToCart = (e, product) => {
    e.stopPropagation();

    const fullVariants = getVariantsForProduct(product);
    const activeVariant = selectedVariants[product.id] || fullVariants[0];
    const basePrice = Number(product.price || 0);

    const multiplier = Number(activeVariant?.multiplier_kg || activeVariant?.multiplier || 1);
    const variantName = activeVariant?.name || `${product.unit || "kg"}`;
    const price = Number(activeVariant?.price || basePrice);

    addToCart({
      id: product.id,
      name: product.name,
      base_price: basePrice,
      price: price,
      multiplier_kg: multiplier,
      variant_name: variantName,
      unit: product.unit,
      display_image: product.display_image || product.image_url,
      farm_id: farm.id,
      farm_name: farm.name,
      available_variants: fullVariants,
      quantity: 1,
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center text-xs text-gray-400">
        Đang tải thông tin trang trại...
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center space-y-3">
        <p className="text-xs text-red-500 font-bold">Không tìm thấy thông tin trang trại.</p>
        <button
          onClick={handleBack}
          className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
        >
          ← Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 font-sans space-y-8">
      {/* Nút quay lại thông minh */}
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-emerald-700 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>

      {/* 1. COVER BANNER */}
      <div className="relative rounded-3xl overflow-hidden min-h-[260px] md:min-h-[300px] flex items-end p-6 md:p-8 bg-slate-900 border border-gray-100 shadow-xs">
        <img
          src={cleanMediaUrl(
            farm.cover_image || farm.banner,
            "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=80"
          )}
          alt={farm.name}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        {/* Nút đổi ảnh bìa: Chỉ hiển thị duy nhất khi người đăng nhập là chủ của trang trại này */}
        {isActualOwner && (
          <label className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-md">
            <Camera className="w-4 h-4" />
            {uploadingCover ? "Đang tải ảnh..." : "Đổi ảnh bìa"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
              disabled={uploadingCover}
            />
          </label>
        )}

        <div className="relative z-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 text-white">
            <span className="inline-flex items-center gap-1.5 bg-emerald-600/90 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />{" "}
              {farm.vietgap_cert_id ? `Chứng nhận VietGAP: ${farm.vietgap_cert_id}` : "Chuẩn VietGAP"}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold">{farm.name}</h1>
            <p className="text-xs text-emerald-100 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {farm.address}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3.5 rounded-2xl text-xs text-white space-y-1 shrink-0">
            <div className="flex items-center gap-1.5 text-emerald-200">
              <User className="w-3.5 h-3.5" /> Chủ sở hữu:{" "}
              <b className="text-white">{farm.owner_name || "Chủ trang trại"}</b>
            </div>
            <div className="flex items-center gap-1.5 text-gray-300 text-[11px]">
              <Calendar className="w-3.5 h-3.5" /> Tham gia:{" "}
              {farm.created_at ? new Date(farm.created_at).toLocaleDateString("vi-VN") : "09/10/2026"}
            </div>
          </div>
        </div>
      </div>

      {/* 2. THÔNG TIN GIỚI THIỆU & TỌA ĐỘ GPS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs space-y-2">
          <h2 className="text-sm font-bold text-gray-900">Giới thiệu & Phương thức canh tác</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            {farm.description ||
              "Trang trại áp dụng quy trình sản xuất nông nghiệp sạch theo tiêu chuẩn VietGAP. Mọi quy trình tưới tiêu, bón phân hữu cơ và quan trắc thổ nhưỡng được ghi chép và kết nối hệ thống cảm biến môi trường để tính toán chỉ số sinh thái Eco-Score minh bạch."}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs space-y-2">
          <h2 className="text-sm font-bold text-gray-900">TỌA ĐỘ ĐỊNH VỊ GPS</h2>
          <div className="text-xs text-gray-500 font-mono space-y-1">
            <div>Vĩ độ: {farm.latitude || "10.68248600"}</div>
            <div>Kinh độ: {farm.longitude || "106.74884400"}</div>
          </div>
          <div className="text-[11px] font-bold text-emerald-700 pt-1">
            ✓ Đã xác thực vị trí canh tác thực địa
          </div>
        </div>
      </div>

      {/* 3. NÔNG SẢN THU HOẠCH TỪ TRANG TRẠI */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-base font-bold text-gray-900">Nông sản thu hoạch từ trang trại</h2>
            <p className="text-xs text-gray-400">Các sản phẩm chính ngạch được cấp mã truy xuất QR</p>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            {farm.products?.length || 0} sản phẩm
          </span>
        </div>

        {!farm.products || farm.products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 text-xs">Trang trại hiện chưa đăng ký nông sản mở bán.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {farm.products.map((p) => {
              const productIdentifier = p.slug || p.id;
              const availableVariants = getVariantsForProduct(p);
              const currentVariant = selectedVariants[p.id] || availableVariants[0];
              const currentPrice = Number(currentVariant?.price || p.price);

              const cartItem = getCartItem(p);
              const inCartQty = cartItem ? cartItem.quantity : 0;
              const uniqueCartId =
                cartItem?.cart_item_id || `${p.id}_${currentVariant?.name || "default"}`;

              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/product/${productIdentifier}`)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition cursor-pointer group"
                >
                  <div>
                    {/* Ảnh sản phẩm & Nhãn Eco */}
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      <img
                        src={cleanMediaUrl(p.display_image || p.image_url)}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80";
                        }}
                      />
                      {p.latest_batch && (
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                          <Award className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-xs font-bold text-emerald-800">
                            Eco {p.latest_batch.eco_score} ({p.latest_batch.eco_grade})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Thông tin sản phẩm */}
                    <div className="p-5 pb-2">
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {p.category || "Rau củ quả"}
                      </span>
                      <h3 className="font-bold text-gray-900 mt-2 text-base group-hover:text-emerald-700 transition line-clamp-1">
                        {p.name}
                      </h3>

                      {/* Menu chọn quy cách nhanh */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 flex items-center justify-between gap-1 bg-slate-50 p-1.5 rounded-xl border border-gray-100"
                      >
                        <span className="text-[11px] text-gray-500 font-medium pl-1">
                          Quy cách:
                        </span>
                        <select
                          value={currentVariant?.name}
                          onChange={(e) => {
                            const found = availableVariants.find(
                              (v) => v.name === e.target.value
                            );
                            if (found) {
                              setSelectedVariants((prev) => ({ ...prev, [p.id]: found }));
                            }
                          }}
                          className="text-[11px] font-bold text-emerald-800 bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          {availableVariants.map((v) => (
                            <option key={v.name} value={v.name}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Hiển thị đơn giá theo quy cách */}
                      <div className="text-emerald-700 font-extrabold text-lg mt-3 flex items-baseline justify-between">
                        <span>{currentPrice.toLocaleString()} đ</span>
                        <span className="text-xs font-normal text-gray-400">
                          quy cách:{" "}
                          <b className="text-gray-700 font-medium">{currentVariant?.name}</b>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cụm nút thao tác (Xuất xứ / Mua / Bộ đếm số lượng) */}
                  <div className="p-5 pt-0 mt-3">
                    <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                      {p.latest_batch && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/trace/${p.latest_batch.batch_code}`);
                          }}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition shrink-0 cursor-pointer"
                          title="Xem truy xuất nguồn gốc lô hàng"
                        >
                          Xuất xứ <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {inCartQty === 0 ? (
                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(e, p)}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" /> Thêm vào giỏ
                        </button>
                      ) : (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-1"
                        >
                          <button
                            type="button"
                            onClick={() => updateQuantity(uniqueCartId, inCartQty - 1)}
                            className="w-7 h-7 flex items-center justify-center bg-white text-emerald-800 rounded-lg hover:bg-emerald-100 transition font-bold shadow-2xs cursor-pointer"
                            title="Giảm bớt"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <div className="text-center px-1">
                            <span className="text-xs font-black text-emerald-900 block leading-tight">
                              {inCartQty}
                            </span>
                            <span className="text-[9px] font-bold text-emerald-600 block leading-none">
                              {(currentPrice * inCartQty).toLocaleString()} đ
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => updateQuantity(uniqueCartId, inCartQty + 1)}
                            className="w-7 h-7 flex items-center justify-center bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-bold shadow-2xs cursor-pointer"
                            title="Thêm số lượng"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}