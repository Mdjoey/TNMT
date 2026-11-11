import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  User, Phone, MapPin, Package, CheckCircle2, Clock, 
  ArrowLeft, Eye, X, AlertCircle, Ban 
} from 'lucide-react';

export default function CustomerProfile() {
  const [profile, setProfile] = useState({ full_name: '', phone: '', address: '' });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State mở xem chi tiết đơn hàng
  const [selectedOrder, setSelectedOrder] = useState(null);

  const token = localStorage.getItem('ecotrace_token');

  const fetchProfileAndOrders = () => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    // Lấy thông tin cá nhân
    axios.get('http://localhost:8000/api/users/profile/', { headers })
      .then(res => setProfile(res.data))
      .catch(console.error);

    // Lấy danh sách đơn hàng của tôi
    axios.get('http://localhost:8000/api/orders/my-orders/', { headers })
      .then(res => {
        const data = res.data.results || res.data || [];
        setOrders(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfileAndOrders();
  }, [token]);

  // Lưu thông tin cá nhân
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('http://localhost:8000/api/users/profile/', profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Đã lưu sổ địa chỉ thành công!");
    } catch {
      alert("Lỗi khi cập nhật thông tin!");
    } finally {
      setSaving(false);
    }
  };

  // Khách hàng hủy đơn hàng trực tiếp
  const handleCancelOrder = async (orderIdentifier) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`http://localhost:8000/api/orders/${orderIdentifier}/cancel-order/`, {}, { headers });
      alert("Đã hủy đơn hàng thành công!");
      
      // Cập nhật lại trạng thái tại chỗ
      setOrders(prev => prev.map(o => (o.order_code === orderIdentifier || o.id === orderIdentifier) ? { ...o, status: 'CANCELLED' } : o));
      if (selectedOrder) {
        setSelectedOrder(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Không thể hủy đơn hàng này.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">Chờ xác nhận</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold">Đã xác nhận</span>;
      case 'SHIPPING':
        return <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[10px] font-bold">Đang giao hàng</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">Giao thành công</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold">Đã hủy</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 font-sans space-y-6">
      {/* 1. NÚT QUAY LẠI SÀN NÔNG SẢN */}
      <div>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-emerald-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại sàn nông sản
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Thông tin tài khoản & Lịch sử mua hàng</h1>
        <p className="text-xs text-gray-500 mt-1">Thông tin này sẽ tự động điền sẵn mỗi khi bạn đặt mua nông sản</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Form cập nhật thông tin */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" /> Sổ địa chỉ mặc định
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Họ và tên</label>
              <input 
                type="text" 
                value={profile.full_name || ''} 
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} 
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Số điện thoại</label>
              <input 
                type="tel" 
                value={profile.phone || ''} 
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })} 
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Địa chỉ giao hàng mặc định</label>
              <textarea 
                rows="3"
                value={profile.address || ''} 
                onChange={(e) => setProfile({ ...profile, address: e.target.value })} 
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none" 
              />
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>
        </div>

        {/* Lịch sử đơn hàng của tài khoản */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" /> Các đơn hàng đã đặt ({orders.length})
            </h2>
            <Link to="/orders" className="text-xs font-semibold text-emerald-600 hover:underline">
              Tra cứu đơn khác →
            </Link>
          </div>

          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-xs text-gray-400 py-12 text-center">Bạn chưa có đơn hàng nào.</p>
            ) : (
              orders.map((ord) => {
                const displayCode = ord.order_code || `ORD-${String(ord.id).padStart(6, '0')}`;
                const canCancel = ord.status === 'PENDING';

                return (
                  <div key={ord.id} className="p-4 bg-slate-50/70 border border-gray-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-800">{displayCode}</span>
                        {getStatusBadge(ord.status)}
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Người nhận: <b>{ord.customer_name}</b> ({ord.customer_phone})
                      </p>
                      <span className="text-[10px] text-gray-400 block">
                        Ngày đặt: {new Date(ord.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
                      <div className="text-right sm:mr-2">
                        <span className="text-xs font-black text-gray-900 block">
                          {Number(ord.total_amount).toLocaleString()} đ
                        </span>
                        <span className="text-[10px] text-gray-400">COD</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Nút Xem chi tiết */}
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(ord)}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-500" /> Chi tiết
                        </button>

                        {/* Nút Hủy đơn nếu còn PENDING */}
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(ord.order_code || ord.id)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" /> Hủy
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT ĐƠN HÀNG */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  Chi tiết đơn hàng: <span className="text-emerald-700">{selectedOrder.order_code || `ORD-${String(selectedOrder.id).padStart(6, '0')}`}</span>
                </h3>
                <span className="text-[10px] text-gray-400">Ngày đặt: {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}</span>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin người nhận */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-gray-100 text-xs space-y-1">
              <p className="text-gray-600">Người nhận: <b className="text-gray-900">{selectedOrder.customer_name}</b></p>
              <p className="text-gray-600">Số điện thoại: <b className="text-gray-900">{selectedOrder.customer_phone}</b></p>
              <p className="text-gray-600">Địa chỉ giao: <b className="text-gray-900">{selectedOrder.shipping_address}</b></p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-gray-500">Trạng thái:</span>
                {getStatusBadge(selectedOrder.status)}
              </div>
            </div>

            {/* Danh sách các sản phẩm trong đơn */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-700">Danh sách nông sản đã đặt:</h4>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl p-2 bg-white">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-gray-800">{item.product_name || item.product?.name || 'Nông sản'}</span>
                      <span className="text-[11px] text-gray-400 block">Số lượng: x{item.quantity}</span>
                    </div>
                    <span className="font-bold text-emerald-700">
                      {Number(item.price * item.quantity).toLocaleString()} đ
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tổng tiền */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100 font-bold">
              <span className="text-xs text-gray-600">Tổng thanh toán COD:</span>
              <span className="text-base text-emerald-700 font-black">
                {Number(selectedOrder.total_amount).toLocaleString()} đ
              </span>
            </div>

            {/* Nút hành động */}
            <div className="flex gap-2 pt-2">
              {selectedOrder.status === 'PENDING' && (
                <button
                  type="button"
                  onClick={() => handleCancelOrder(selectedOrder.order_code || selectedOrder.id)}
                  className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition"
                >
                  Hủy đơn hàng này
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl text-xs font-bold transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}