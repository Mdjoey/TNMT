import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Store,
  MapPin,
  Phone,
  User,
  FileText,
  CheckSquare,
  Square,
  ShieldCheck,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import axios from "axios";
import { useCart } from "../context/CartContext";

export default function CartDrawer({ isOpen, onClose }) {
  const {
    cartItems,
    updateQuantity,
    updateVariant,
    removeFromCart,
    clearCart,
  } = useCart();
  const navigate = useNavigate();

  // State lưu danh sách ID sản phẩm được chọn
  const [selectedIds, setSelectedIds] = useState([]);

  // State bước: 'cart' (xem giỏ) hoặc 'checkout' (nhập thông tin COD)
  const [step, setStep] = useState("cart");

  // Form thông tin người nhận COD
  const [orderForm, setOrderForm] = useState({
    customer_name: "",
    customer_phone: "",
    shipping_address: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(false);

  // Tự động chọn tất cả khi danh sách sản phẩm thay đổi
  useEffect(() => {
    setSelectedIds(cartItems.map((item) => item.cart_item_id || item.id));
  }, [cartItems.length]);

  // Tự động nạp thông tin từ Hồ sơ khi mở giỏ hàng
  useEffect(() => {
    if (isOpen) {
      const token =
        localStorage.getItem("ecotrace_token") || localStorage.getItem("token");
      if (token) {
        axios
          .get("http://localhost:8000/api/users/profile/", {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            const data = res.data;
            const name =
              data.full_name || data.customer_name || data.username || "";
            const phone =
              data.phone || data.customer_phone || data.phone_number || "";
            const address = data.address || data.shipping_address || "";

            if (name || phone || address) {
              setOrderForm((prev) => ({
                ...prev,
                customer_name: prev.customer_name || name,
                customer_phone: prev.customer_phone || phone,
                shipping_address: prev.shipping_address || address,
              }));
              setIsAutoFilled(true);
            }
          })
          .catch((err) => {
            console.warn("Chưa đăng nhập hoặc không nạp được hồ sơ:", err);
          });
      }
    }
  }, [isOpen, step]);

  // Nhóm các sản phẩm theo Nhà Vườn / Shop
  const groupedByFarm = useMemo(() => {
    const groups = {};
    cartItems.forEach((item) => {
      const farmName = item.farm_name || "Nông Trại Hữu Cơ EcoTrace";
      const farmId = item.farm_id || "default";
      if (!groups[farmId]) {
        groups[farmId] = {
          id: farmId,
          name: farmName,
          items: [],
        };
      }
      groups[farmId].items.push(item);
    });
    return groups;
  }, [cartItems]);

  // Toggle chọn sản phẩm
  const toggleSelectItem = (uniqueId) => {
    setSelectedIds((prev) =>
      prev.includes(uniqueId)
        ? prev.filter((id) => id !== uniqueId)
        : [...prev, uniqueId],
    );
  };

  // Toggle chọn toàn bộ shop
  const toggleSelectFarm = (farmItems) => {
    const itemIds = farmItems.map((i) => i.cart_item_id || i.id);
    const allSelected = itemIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !itemIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...itemIds])));
    }
  };

  // Tính tổng tiền & số lượng sản phẩm được chọn
  const { totalSelectedAmount, totalSelectedCount, selectedProducts } =
    useMemo(() => {
      const selected = cartItems.filter((item) =>
        selectedIds.includes(item.cart_item_id || item.id),
      );
      const amount = selected.reduce(
        (sum, item) => sum + Number(item.price || 0) * (item.quantity || 1),
        0,
      );
      const count = selected.reduce(
        (sum, item) => sum + (item.quantity || 1),
        0,
      );
      return {
        totalSelectedAmount: amount,
        totalSelectedCount: count,
        selectedProducts: selected,
      };
    }, [cartItems, selectedIds]);

  // Xử lý gửi đơn hàng COD
  const handleCheckoutCOD = async (e) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      alert("Vui lòng chọn ít nhất một nông sản để đặt hàng!");
      return;
    }
    if (
      !orderForm.customer_name.trim() ||
      !orderForm.customer_phone.trim() ||
      !orderForm.shipping_address.trim()
    ) {
      alert("Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ giao hàng!");
      return;
    }

    setSubmitting(true);
    const token =
      localStorage.getItem("ecotrace_token") || localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const payload = {
      customer_name: orderForm.customer_name.trim(),
      customer_phone: orderForm.customer_phone.trim(),
      shipping_address: orderForm.shipping_address.trim(),
      notes: orderForm.notes.trim(),
      total_amount: totalSelectedAmount,
      items: selectedProducts.map((p) => ({
        product_id: p.id,
        quantity: p.quantity,
        multiplier_kg: p.multiplier_kg || 1.0,
        price: p.price,
      })),
    };

    try {
      await axios.post("http://localhost:8000/api/orders/", payload, {
        headers,
      });
      alert("Đặt hàng thành công! Đơn hàng COD đã được gửi đến nhà vườn.");
      selectedProducts.forEach((p) => removeFromCart(p.cart_item_id || p.id));
      setStep("cart");
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Có lỗi xảy ra khi tạo đơn hàng.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between font-sans">
        {/* Header Drawer */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-gray-900">
              {step === "cart"
                ? `Giỏ hàng của bạn (${cartItems.length})`
                : "Thông tin nhận hàng (COD)"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setStep("cart");
              onClose();
            }}
            className="p-1 hover:bg-slate-200 rounded-full text-gray-400 hover:text-gray-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung chính */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="py-24 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto" />
              <p className="text-xs text-gray-400">
                Giỏ hàng của bạn đang trống.
              </p>
            </div>
          ) : step === "cart" ? (
            /* Bước 1: Danh sách sản phẩm gom theo Shop */
            <div className="space-y-4">
              {Object.entries(groupedByFarm).map(([farmId, group]) => {
                const farmItemIds = group.items.map(
                  (i) => i.cart_item_id || i.id,
                );
                const isAllFarmSelected = farmItemIds.every((id) =>
                  selectedIds.includes(id),
                );

                return (
                  <div
                    key={farmId}
                    className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-3"
                  >
                    {/* Header Nhà Vườn (Có thể click vào để xem Farm) */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                      <div
                        onClick={() => toggleSelectFarm(group.items)}
                        className="flex items-center gap-2 cursor-pointer select-none"
                      >
                        {isAllFarmSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-300" />
                        )}
                        <Store className="w-4 h-4 text-emerald-700" />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          navigate(
                            `/farm/${group.id !== "default" ? group.id : ""}`,
                          );
                        }}
                        className="text-xs font-bold text-gray-800 hover:text-emerald-700 flex items-center gap-1 group text-left truncate flex-1 ml-2 cursor-pointer"
                      >
                        <span className="truncate">{group.name}</span>
                        <span className="text-[10px] text-gray-400 group-hover:text-emerald-600">
                          
                        </span>
                      </button>
                    </div>

                    {/* Danh sách nông sản thuộc nhà vườn */}
                    <div className="space-y-3 divide-y divide-gray-50">
                      {group.items.map((item) => {
                        const uniqueId =
                          item.cart_item_id ||
                          `${item.id}_${item.variant_name || item.unit || "default"}`;
                        const isChecked = selectedIds.includes(uniqueId);

                        // Danh sách quy cách đóng gói có sẵn hoặc fallback theo đơn vị hiện tại
                        const variantsList =
                          item.available_variants &&
                          item.available_variants.length > 0
                            ? item.available_variants
                            : [
                                {
                                  name:
                                    item.variant_name ||
                                    item.unit ||
                                    "Mặc định",
                                  price: item.price,
                                  multiplier_kg: item.multiplier_kg || 1.0,
                                },
                              ];

                        const currentVariantName =
                          item.variant_name ||
                          item.unit ||
                          variantsList[0]?.name;

                        return (
                          <div
                            key={uniqueId}
                            className="pt-2.5 first:pt-0 flex items-start gap-3"
                          >
                            {/* Checkbox chọn sản phẩm */}
                            <button
                              type="button"
                              onClick={() => toggleSelectItem(uniqueId)}
                              className="mt-2 text-gray-300 hover:text-emerald-600 transition cursor-pointer shrink-0"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-300" />
                              )}
                            </button>

                            {/* Click vào Ảnh sản phẩm để vào chi tiết */}
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                navigate(`/product/${item.id}`);
                              }}
                              className="shrink-0 cursor-pointer"
                            >
                              <img
                                src={item.display_image || item.image_url}
                                alt={item.name}
                                className="w-14 h-14 rounded-xl object-cover bg-slate-50 border border-gray-100 hover:opacity-90 transition"
                              />
                            </button>

                            {/* Thông tin & Thay đổi Quy cách */}
                            <div className="flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  navigate(`/product/${item.id}`);
                                }}
                                className="text-xs font-bold text-gray-800 hover:text-emerald-700 truncate block text-left w-full cursor-pointer"
                              >
                                {item.name}
                              </button>

                              {/* Dropdown cho phép đổi quy cách đóng gói */}
                              {/* Dropdown cho phép đổi quy cách đóng gói */}
                              {/* Dropdown cho phép đổi quy cách đóng gói */}
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[11px] text-gray-400">
                                  Quy cách:
                                </span>
                                <div className="relative inline-flex items-center">
                                  {(() => {
                                    // Luôn lấy giá gốc không đổi (nếu chưa có thì lấy tạm price ban đầu)
                                    const basePrice = Number(
                                      item.base_price || item.price || 0,
                                    );
                                    const u = (item.unit || "kg").toLowerCase();

                                    // Danh sách quy cách chuẩn hóa, tính cố định theo basePrice
                                    let variantsList = [];
                                    if (
                                      [
                                        "hộp",
                                        "khay",
                                        "túi",
                                        "trái",
                                        "quả",
                                        "bắp",
                                        "bó",
                                        "chùm",
                                      ].includes(u)
                                    ) {
                                      variantsList = [
                                        {
                                          name: `1 ${item.unit} (Lẻ)`,
                                          price: basePrice,
                                          multiplier_kg: 1,
                                        },
                                        {
                                          name: `Combo 3 ${item.unit}`,
                                          price: Math.round(basePrice * 2.9),
                                          multiplier_kg: 3,
                                        },
                                        {
                                          name: `Combo 5 ${item.unit}`,
                                          price: Math.round(basePrice * 4.7),
                                          multiplier_kg: 5,
                                        },
                                        {
                                          name: `Thùng 10 ${item.unit}`,
                                          price: Math.round(basePrice * 9.0),
                                          multiplier_kg: 10,
                                        },
                                      ];
                                    } else if (u === "g") {
                                      variantsList = [
                                        {
                                          name: "Gói 100g (Dùng thử)",
                                          price: Math.round(basePrice * 100),
                                          multiplier_kg: 100,
                                        },
                                        {
                                          name: "Gói 250g (Tiêu chuẩn)",
                                          price: Math.round(basePrice * 250),
                                          multiplier_kg: 250,
                                        },
                                        {
                                          name: "Gói 500g (Tiết kiệm)",
                                          price: Math.round(basePrice * 480),
                                          multiplier_kg: 500,
                                        },
                                        {
                                          name: "Hộp 1.000g (1 kg)",
                                          price: Math.round(basePrice * 920),
                                          multiplier_kg: 1000,
                                        },
                                      ];
                                    } else {
                                      variantsList = [
                                        {
                                          name: "Gói 500g (Dùng thử)",
                                          price: Math.round(basePrice * 0.55),
                                          multiplier_kg: 0.5,
                                        },
                                        {
                                          name: "Túi 1 kg (Tiêu chuẩn)",
                                          price: basePrice,
                                          multiplier_kg: 1.0,
                                        },
                                        {
                                          name: "Combo 3 kg (Gia đình)",
                                          price: Math.round(basePrice * 2.85),
                                          multiplier_kg: 3.0,
                                        },
                                        {
                                          name: "Thùng 5 kg (Tiết kiệm)",
                                          price: Math.round(basePrice * 4.6),
                                          multiplier_kg: 5.0,
                                        },
                                      ];
                                    }

                                    const currentVariantName =
                                      item.variant_name ||
                                      variantsList[0]?.name;

                                    return (
                                      <select
                                        value={currentVariantName}
                                        onChange={(e) => {
                                          const chosen = variantsList.find(
                                            (v) => v.name === e.target.value,
                                          );
                                          if (chosen && updateVariant) {
                                            updateVariant(uniqueId, {
                                              ...chosen,
                                              base_price: basePrice, // Bảo toàn giá gốc qua các lần đổi
                                            });
                                          }
                                        }}
                                        className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-lg pl-2 pr-6 py-0.5 outline-none focus:border-emerald-600 cursor-pointer appearance-none max-w-[190px] truncate"
                                      >
                                        {variantsList.map((v, idx) => (
                                          <option key={idx} value={v.name}>
                                            {v.name} (
                                            {Number(v.price).toLocaleString()}{" "}
                                            đ)
                                          </option>
                                        ))}
                                      </select>
                                    );
                                  })()}
                                  <ChevronDown className="w-3 h-3 text-emerald-700 absolute right-1.5 pointer-events-none" />
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs font-black text-emerald-700">
                                  {Number(item.price).toLocaleString()} đ
                                </span>

                                {/* Bộ nút tăng giảm số lượng */}
                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-slate-50">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuantity(
                                        uniqueId,
                                        (item.quantity || 1) - 1,
                                      )
                                    }
                                    className="p-1 hover:bg-slate-200 text-gray-500 cursor-pointer"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="px-2 text-xs font-bold text-gray-700">
                                    {item.quantity || 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuantity(
                                        uniqueId,
                                        (item.quantity || 1) + 1,
                                      )
                                    }
                                    className="p-1 hover:bg-slate-200 text-gray-500 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Xóa món */}
                            <button
                              type="button"
                              onClick={() => removeFromCart(uniqueId)}
                              className="p-1 text-gray-300 hover:text-rose-500 transition cursor-pointer"
                              title="Xóa khỏi giỏ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Bước 2: Form nhập thông tin nhận COD */
            <form
              id="cod-form"
              onSubmit={handleCheckoutCOD}
              className="space-y-4"
            >
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Thanh toán trực tiếp khi nhận hàng (COD). Kiểm tra hàng trước
                  khi thanh toán.
                </span>
              </div>

              {isAutoFilled && (
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-emerald-200/60 rounded-xl text-[11px] text-emerald-800">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Đã tự động điền từ Sổ địa chỉ mặc định
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate("/profile");
                    }}
                    className="font-bold underline hover:text-emerald-950 cursor-pointer"
                  >
                    Sửa hồ sơ 
                  </button>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Họ và tên người nhận *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={orderForm.customer_name}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        customer_name: e.target.value,
                      })
                    }
                    className="w-full text-xs pl-8 pr-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                  />
                  <User className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Số điện thoại nhận hàng *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="0912 345 678"
                    value={orderForm.customer_phone}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        customer_phone: e.target.value,
                      })
                    }
                    className="w-full text-xs pl-8 pr-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 font-mono"
                  />
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Địa chỉ giao hàng chi tiết *
                </label>
                <div className="relative">
                  <textarea
                    rows="2"
                    required
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                    value={orderForm.shipping_address}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        shipping_address: e.target.value,
                      })
                    }
                    className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                  />
                  <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Ghi chú cho nhà vườn / shipper
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Giao giờ hành chính, gọi trước khi tới..."
                    value={orderForm.notes}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, notes: e.target.value })
                    }
                    className="w-full text-xs pl-8 pr-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                  />
                  <FileText className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer tổng tiền & nút bấm */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-slate-50/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">
                Đã chọn: <b className="text-gray-900">{totalSelectedCount}</b>{" "}
                sản phẩm
              </span>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block">
                  Tổng tiền thanh toán COD:
                </span>
                <span className="text-base font-black text-emerald-700">
                  {totalSelectedAmount.toLocaleString()} đ
                </span>
              </div>
            </div>

            {step === "cart" ? (
              <button
                type="button"
                disabled={selectedProducts.length === 0}
                onClick={() => setStep("checkout")}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                Tiến hành đặt hàng ({selectedProducts.length} món) →
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("cart")}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  ← Quay lại
                </button>
                <button
                  type="submit"
                  form="cod-form"
                  disabled={submitting}
                  className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {submitting ? "Đang tạo đơn..." : "Xác nhận đặt đơn COD"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
