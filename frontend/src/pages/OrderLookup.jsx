import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  Search,
  Package,
  Eye,
  X,
  Store,
  ArrowUpRight,
  Image as ImageIcon,
} from "lucide-react";

const STATUS_KEYS = ["PENDING", "CONFIRMED", "SHIPPING", "DELIVERED"];

// Hàm làm sạch và chuẩn hóa đường dẫn ảnh (loại bỏ ký tự rác **, ), ")
const cleanImageUrl = (url) => {
  if (!url) return null;
  let clean = String(url)
    .trim()
    .replace(/[\*\)\"\'\s]+$/, "");
  if (!clean) return null;
  if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
  return `http://localhost:8000${clean.startsWith("/") ? "" : "/"}${clean}`;
};

export default function OrderLookup() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCode, setSearchCode] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Quay lại đúng trang khách vừa đứng trước đó
  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/products"); // Dự phòng nếu khách gõ link trực tiếp
    }
  };

  // 1. Tải danh sách đơn hàng
  const fetchOrders = () => {
    const token = localStorage.getItem("ecotrace_token");

    if (isAuthenticated && token) {
      setLoading(true);
      axios
        .get("http://localhost:8000/api/orders/my-orders/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setOrders(res.data.results || res.data || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setOrders([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    setHasSearched(false);
    fetchOrders();
  }, [isAuthenticated]);

  // 2. Tra cứu chủ động
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchCode.trim()) {
      setHasSearched(false);
      fetchOrders();
      return;
    }

    setLoading(true);
    setHasSearched(true);
    const term = searchCode.trim();
    const token = localStorage.getItem("ecotrace_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    axios
      .get(`http://localhost:8000/api/orders/${term}/`, { headers })
      .then((res) => {
        setOrders([res.data]);
      })
      .catch(() => {
        axios
          .get(
            `http://localhost:8000/api/orders/?search=${encodeURIComponent(term)}`,
            { headers },
          )
          .then((res) => {
            const results = res.data.results || res.data || [];
            setOrders(results);
          })
          .catch(() => setOrders([]));
      })
      .finally(() => setLoading(false));
  };

  // 3. Khách hàng hủy đơn hàng
  const handleCancelOrder = async (orderIdentifier) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?"))
      return;

    try {
      const token = localStorage.getItem("ecotrace_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(
        `http://localhost:8000/api/orders/${orderIdentifier}/cancel-order/`,
        {},
        { headers },
      );
      alert("Đã hủy đơn hàng thành công!");

      setOrders((prev) =>
        prev.map((o) =>
          o.order_code === orderIdentifier || o.id === orderIdentifier
            ? { ...o, status: "CANCELLED" }
            : o,
        ),
      );
      if (selectedOrder) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, status: "CANCELLED" } : null,
        );
      }
    } catch (err) {
      alert(err.response?.data?.error || "Không thể hủy đơn hàng.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
            Chờ xác nhận (COD)
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold">
            Đã xác nhận
          </span>
        );
      case "SHIPPING":
        return (
          <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[10px] font-bold">
            Đang giao hàng
          </span>
        );
      case "DELIVERED":
        return (
          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
            Giao thành công
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold">
            Đã hủy (COD)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 font-sans space-y-6">
      {/* Nút quay lại & Chuyển sang Profile */}
      <div className="flex justify-between items-center">
        <button
  type="button"
  onClick={handleGoBack}
  className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-emerald-700 transition cursor-pointer"
>
  <ArrowLeft className="w-4 h-4" /> Quay lại trang trước
</button>
        {isAuthenticated && (
          <Link
            to="/profile"
            className="text-xs font-semibold text-emerald-600 hover:underline"
          >
            Xem sổ địa chỉ & hồ sơ →
          </Link>
        )}
      </div>

      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Đơn hàng của tôi</h1>
        <p className="text-xs text-gray-500">
          {isAuthenticated
            ? `Xin chào ${user?.username}, dưới đây là toàn bộ đơn hàng của bạn.`
            : "Tra cứu nhanh trạng thái đơn hàng bằng mã đơn hoặc số điện thoại."}
        </p>
      </div>

      {/* Form tra cứu mã đơn */}
      <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Nhập mã đơn (VD: ORD-Z9PR9OLU) hoặc SĐT..."
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500 shadow-2xs"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
        >
          Tra cứu
        </button>
      </form>

      {/* DANH SÁCH ĐƠN HÀNG */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-xs">
          Đang tải danh sách đơn hàng...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-3xl border border-gray-100 p-8 space-y-4 max-w-lg mx-auto shadow-2xs">
          <Package className="w-12 h-12 text-emerald-600/60 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-gray-800">
              {hasSearched
                ? "Không tìm thấy đơn hàng nào"
                : "Tra cứu thông tin đơn hàng"}
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {hasSearched
                ? `Không có đơn hàng nào khớp với "${searchCode}". Vui lòng kiểm tra lại mã đơn hoặc số điện thoại.`
                : "Vui lòng nhập Mã đơn hàng hoặc Số điện thoại nhận hàng vào thanh tìm kiếm phía trên để kiểm tra hành trình đơn."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((ord) => {
            const displayCode =
              ord.order_code || `ORD-${String(ord.id).padStart(6, "0")}`;
            const currentStepIdx = STATUS_KEYS.indexOf(ord.status);
            const isCancelled = ord.status === "CANCELLED";
            const canCancel = ord.status === "PENDING";

            // Trích xuất Farm ID & Name
            const firstItem = ord.items?.[0] || {};
            const farmId =
              ord.farm_id ||
              ord.farm?.id ||
              ord.farm ||
              firstItem.farm_id ||
              firstItem.product?.farm?.id ||
              firstItem.product?.farm ||
              1;
            const farmName =
              ord.farm_name ||
              ord.farm?.name ||
              firstItem.farm_name ||
              firstItem.product?.farm?.name ||
              "Nông trại Shop";

            return (
              <div
                key={ord.id}
                className="bg-white rounded-3xl p-5 md:p-6 border border-gray-100 shadow-2xs space-y-5"
              >
                {/* 1. Header card: Tên Trang Trại */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                      <Link
                        to={`/farm/${farmId}`}
                        className="text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {farmName}
                        <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                      </Link>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                      <span className="font-bold text-gray-700">
                        Đơn hàng {displayCode}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(ord.created_at).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(ord.status)}
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() =>
                          handleCancelOrder(ord.order_code || ord.id)
                        }
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Hủy đơn
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Thanh tiến trình trạng thái kết nối chuẩn xác */}
                {isCancelled ? (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-center text-xs font-semibold text-rose-700">
                    Đơn hàng này đã bị hủy.
                  </div>
                ) : (
                  <div className="py-2 px-4 max-w-2xl mx-auto">
                    <div className="flex items-center justify-between">
                      {[
                        { num: 1, label: "Chờ xác nhận" },
                        { num: 2, label: "Đã xác nhận" },
                        { num: 3, label: "Đang giao hàng" },
                        { num: 4, label: "Giao thành công" },
                      ].map((step, idx, arr) => {
                        const isDone = currentStepIdx >= idx;
                        const isCurrent = currentStepIdx === idx;
                        const isNextLineActive = currentStepIdx > idx;

                        return (
                          <React.Fragment key={idx}>
                            <div className="flex flex-col items-center shrink-0 relative">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs ${
                                  isCurrent
                                    ? "bg-emerald-600 text-white ring-4 ring-emerald-100 scale-110 z-10"
                                    : isDone
                                      ? "bg-emerald-600 text-white z-10"
                                      : "bg-white border-2 border-slate-200 text-gray-400 z-10"
                                }`}
                              >
                                {step.num}
                              </div>
                              <span
                                className={`text-[11px] mt-2 font-medium absolute top-8 whitespace-nowrap text-center ${
                                  isCurrent
                                    ? "text-emerald-900 font-extrabold"
                                    : isDone
                                      ? "text-gray-700 font-bold"
                                      : "text-gray-400"
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>

                            {idx < arr.length - 1 && (
                              <div className="flex-1 h-1 mx-2 bg-slate-100 rounded-full relative overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    isNextLineActive
                                      ? "bg-emerald-600 w-full"
                                      : "w-0"
                                  }`}
                                />
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                    <div className="h-6" />
                  </div>
                )}

                {/* 3. Danh sách sản phẩm trong đơn */}
                <div className="divide-y divide-gray-50 pt-1">
                  {(ord.items || []).slice(0, 3).map((item, idx) => {
                    const productId =
                      item.product_id || item.product?.id || item.id;
                    const productName =
                      item.product_name || item.product?.name || "Nông sản";

                    // Làm sạch link ảnh
                    const formattedImg = cleanImageUrl(
                      item.product_image ||
                        item.product?.display_image ||
                        item.product?.image_url,
                    );

                    return (
                      <div
                        key={idx}
                        className="py-2.5 flex items-center justify-between text-xs gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {formattedImg ? (
                            <Link
                              to={`/product/${productId}`}
                              className="shrink-0"
                            >
                              <img
                                src={formattedImg}
                                alt={productName}
                                className="w-10 h-10 rounded-xl object-cover bg-slate-50 border border-gray-100 hover:opacity-85 transition shrink-0"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src =
                                    "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80";
                                }}
                              />
                            </Link>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                              <ImageIcon className="w-4 h-4 text-gray-300" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <Link
                              to={`/product/${productId}`}
                              className="font-bold text-gray-900 hover:text-emerald-700 hover:underline transition block truncate cursor-pointer"
                            >
                              {productName} 
                            </Link>
                            <span className="text-gray-400 text-[11px] block mt-0.5">
                              Số lượng: x{item.quantity}
                            </span>
                          </div>
                        </div>

                        <span className="font-extrabold text-gray-900 shrink-0">
                          {Number(item.price * item.quantity).toLocaleString()}{" "}
                          đ
                        </span>
                      </div>
                    );
                  })}
                  {(ord.items || []).length > 3 && (
                    <div className="py-1 text-right">
                      <span className="text-[11px] text-emerald-600 font-medium">
                        + {(ord.items || []).length - 3} mặt hàng khác...
                      </span>
                    </div>
                  )}
                </div>

                {/* 4. Footer đơn: Người nhận, Tổng tiền, Nút xem chi tiết */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-50">
                  <div className="text-xs text-gray-500">
                    <p>
                      Người nhận:{" "}
                      <b className="text-gray-800">{ord.customer_name}</b> (
                      {ord.customer_phone})
                    </p>
                    <p className="line-clamp-1 text-[11px] text-gray-400">
                      Địa chỉ: {ord.shipping_address}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block">
                        Tổng tiền COD:
                      </span>
                      <span className="text-base font-black text-emerald-700">
                        {Number(ord.total_amount).toLocaleString()} đ
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedOrder(ord)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* POPUP CHI TIẾT ĐƠN HÀNG */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  Chi tiết đơn hàng:{" "}
                  <span className="text-emerald-700">
                    {selectedOrder.order_code ||
                      `ORD-${String(selectedOrder.id).padStart(6, "0")}`}
                  </span>
                </h3>
                <span className="text-[10px] text-gray-400">
                  Ngày đặt:{" "}
                  {new Date(selectedOrder.created_at).toLocaleString("vi-VN")}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin người nhận */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-gray-100 text-xs space-y-1">
              <p className="text-gray-600">
                Người nhận:{" "}
                <b className="text-gray-900">{selectedOrder.customer_name}</b>
              </p>
              <p className="text-gray-600">
                Số điện thoại:{" "}
                <b className="text-gray-900">{selectedOrder.customer_phone}</b>
              </p>
              <p className="text-gray-600">
                Địa chỉ giao:{" "}
                <b className="text-gray-900">
                  {selectedOrder.shipping_address}
                </b>
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-gray-500">Trạng thái:</span>
                {getStatusBadge(selectedOrder.status)}
              </div>
            </div>

            {/* Danh sách toàn bộ các sản phẩm trong Modal */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-700">
                Tất cả nông sản trong đơn:
              </h4>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl p-2 bg-white max-h-56 overflow-y-auto">
                {(selectedOrder.items || []).map((item, idx) => {
                  const pId = item.product_id || item.product?.id || item.id;
                  const pName =
                    item.product_name || item.product?.name || "Nông sản";

                  return (
                    <div
                      key={idx}
                      className="py-2.5 flex justify-between items-center text-xs gap-3"
                    >
                      <div className="min-w-0">
                        <Link
                          to={`/product/${pId}`}
                          onClick={() => setSelectedOrder(null)}
                          className="font-bold text-gray-800 hover:text-emerald-700 hover:underline block truncate cursor-pointer"
                        >
                          {pName} 
                        </Link>
                        <span className="text-[11px] text-gray-400 block">
                          Số lượng: x{item.quantity}
                        </span>
                      </div>
                      <span className="font-bold text-emerald-700 shrink-0">
                        {Number(item.price * item.quantity).toLocaleString()} đ
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tổng tiền */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100 font-bold">
              <span className="text-xs text-gray-600">
                Tổng thanh toán COD:
              </span>
              <span className="text-base text-emerald-700 font-black">
                {Number(selectedOrder.total_amount).toLocaleString()} đ
              </span>
            </div>

            {/* Nút đóng */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
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
