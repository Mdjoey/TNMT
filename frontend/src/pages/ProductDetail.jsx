import React, { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ShieldCheck,
  MapPin,
  QrCode,
  ShoppingCart,
  Star,
  ArrowLeft,
  CheckCircle2,
  CornerDownRight,
  LogIn,
  Sparkles,
} from "lucide-react";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const authContext = useContext(AuthContext);

  const user = authContext?.user;
  const isAuthenticated = !!user;

  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState({
    same_farm: [],
    same_category: [],
  });
  const [loading, setLoading] = useState(true);

  // Xử lý nút quay lại thông minh
  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/products");
    }
  };

  // Phân loại & số lượng
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [buyQuantity, setBuyQuantity] = useState(1);

  // Form Đánh giá của khách
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // State cho chủ shop trả lời review
  const [replyInputs, setReplyInputs] = useState({});

  const loadProductData = () => {
    setLoading(true);
    const token = localStorage.getItem("ecotrace_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    axios
      .get(`http://localhost:8000/api/products/${id}/`, { headers })
      .then((res) => {
        setProduct(res.data);
        const dbVariants = res.data.variants || [];
        if (dbVariants.length > 0) {
          setSelectedVariant(dbVariants[0]);
        } else {
          const unit = (res.data.unit || "kg").trim().toLowerCase();
          const basePrice = Number(res.data.price || 0);
          let defaultList = [];

          if (unit === "g") {
            defaultList = [
              {
                name: "Gói 100g (Dùng thử)",
                multiplier_kg: 100,
                price: Math.round(basePrice * 100),
              },
              {
                name: "Gói 250g (Tiêu chuẩn)",
                multiplier_kg: 250,
                price: Math.round(basePrice * 250),
              },
              {
                name: "Gói 500g (Tiết kiệm)",
                multiplier_kg: 500,
                price: Math.round(basePrice * 480),
              },
              {
                name: "Hộp 1.000g (1 kg)",
                multiplier_kg: 1000,
                price: Math.round(basePrice * 920),
              },
            ];
          } else if (
            ["trái", "quả", "bắp", "bó", "hộp", "khay", "túi", "chùm"].includes(
              unit,
            )
          ) {
            defaultList = [
              {
                name: `1 ${res.data.unit} (Lẻ)`,
                multiplier_kg: 1,
                price: basePrice,
              },
              {
                name: `Combo 3 ${res.data.unit}`,
                multiplier_kg: 3,
                price: Math.round(basePrice * 2.9),
              },
              {
                name: `Combo 5 ${res.data.unit}`,
                multiplier_kg: 5,
                price: Math.round(basePrice * 4.7),
              },
              {
                name: `Thùng 10 ${res.data.unit}`,
                multiplier_kg: 10,
                price: Math.round(basePrice * 9.0),
              },
            ];
          } else {
            defaultList = [
              {
                name: "Gói 500g (Dùng thử)",
                multiplier_kg: 0.5,
                price: Math.round(basePrice * 0.55),
              },
              {
                name: "Túi 1 kg (Tiêu chuẩn)",
                multiplier_kg: 1.0,
                price: basePrice,
              },
              {
                name: "Combo 3 kg (Gia đình)",
                multiplier_kg: 3.0,
                price: Math.round(basePrice * 2.85),
              },
              {
                name: "Thùng 5 kg (Tiết kiệm)",
                multiplier_kg: 5.0,
                price: Math.round(basePrice * 4.6),
              },
            ];
          }
          setSelectedVariant(defaultList[1] || defaultList[0]);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    axios
      .get(`http://localhost:8000/api/products/${id}/recommendations/`, {
        headers,
      })
      .then((res) => setRecommendations(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    loadProductData();
  }, [id]);

  const baseUnit = product?.unit?.trim() || "kg";
  const basePrice = Number(product?.price || 0);

  const variantsList =
    product?.variants && product.variants.length > 0
      ? product.variants
      : baseUnit.toLowerCase() === "g"
        ? [
            {
              name: "Gói 100g (Dùng thử)",
              multiplier_kg: 100,
              price: Math.round(basePrice * 100),
            },
            {
              name: "Gói 250g (Tiêu chuẩn)",
              multiplier_kg: 250,
              price: Math.round(basePrice * 250),
            },
            {
              name: "Gói 500g (Tiết kiệm)",
              multiplier_kg: 500,
              price: Math.round(basePrice * 480),
            },
            {
              name: "Hộp 1.000g (1 kg)",
              multiplier_kg: 1000,
              price: Math.round(basePrice * 920),
            },
          ]
        : ["trái", "quả", "bắp", "bó", "hộp", "khay", "túi", "chùm"].includes(
              baseUnit.toLowerCase(),
            )
          ? [
              {
                name: `1 ${baseUnit} (Lẻ)`,
                multiplier_kg: 1,
                price: basePrice,
              },
              {
                name: `Combo 3 ${baseUnit}`,
                multiplier_kg: 3,
                price: Math.round(basePrice * 2.9),
              },
              {
                name: `Combo 5 ${baseUnit}`,
                multiplier_kg: 5,
                price: Math.round(basePrice * 4.7),
              },
              {
                name: `Thùng 10 ${baseUnit}`,
                multiplier_kg: 10,
                price: Math.round(basePrice * 9.0),
              },
            ]
          : [
              {
                name: "Gói 500g (Dùng thử)",
                multiplier_kg: 0.5,
                price: Math.round(basePrice * 0.55),
              },
              {
                name: "Túi 1 kg (Tiêu chuẩn)",
                multiplier_kg: 1.0,
                price: basePrice,
              },
              {
                name: "Combo 3 kg (Gia đình)",
                multiplier_kg: 3.0,
                price: Math.round(basePrice * 2.85),
              },
              {
                name: "Thùng 5 kg (Tiết kiệm)",
                multiplier_kg: 5.0,
                price: Math.round(basePrice * 4.6),
              },
            ];

  const currentVariant = selectedVariant || variantsList[0];
  const stock = Number(product?.stock_quantity ?? 0);
  const multiplierVal = Number(
    currentVariant?.multiplier_kg || currentVariant?.multiplier || 1.0,
  );
  const maxCanBuy = Math.floor(stock / multiplierVal);

  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = () => {
    if (!product || !currentVariant) return;

    if (maxCanBuy <= 0) {
      alert("Nông sản này hiện đã tạm hết hàng trong kho!");
      return;
    }

    if (buyQuantity > maxCanBuy) {
      alert(
        `Trong kho chỉ còn đủ cung cấp tối đa ${maxCanBuy} phần cho phân loại này!`,
      );
      return;
    }

    const farmId =
      product.farm?.id ||
      product.farm_id ||
      (typeof product.farm === "number" ? product.farm : null) ||
      "default_farm";

    addToCart({
      id: product.id,
      name: product.name,
      base_price: basePrice,
      variant_name: currentVariant.name,
      multiplier_kg: multiplierVal,
      price: Number(currentVariant.price),
      unit: product.unit || currentVariant.name,
      image_url: product.display_image || product.image_url,
      quantity: Number(buyQuantity),
      farm_id: farmId,
      farm_name: product.farm_name || "Nông Trại Shop",
      stock_quantity: stock,
      base_unit: baseUnit,
      available_variants: variantsList,
    });

    alert(
      `Đã thêm ${buyQuantity} x ${product.name} [${currentVariant.name}] vào giỏ hàng!`,
    );
  };

  // Gửi đánh giá
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập tài khoản để gửi đánh giá.");
      return;
    }
    if (!commentInput.trim()) return;

    setSubmittingReview(true);
    const token = localStorage.getItem("ecotrace_token");
    try {
      const res = await axios.post(
        `http://localhost:8000/api/products/${id}/add-review/`,
        {
          rating: ratingInput,
          comment: commentInput.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      alert("Cảm ơn bạn đã gửi đánh giá cho nông sản!");
      setCommentInput("");

      setProduct((prev) => {
        if (!prev) return prev;
        const updatedReviews = [res.data, ...(prev.reviews || [])];
        const newAvg = (
          updatedReviews.reduce((sum, r) => sum + r.rating, 0) /
          updatedReviews.length
        ).toFixed(1);
        return {
          ...prev,
          reviews: updatedReviews,
          user_has_reviewed: true,
          avg_rating: newAvg,
          review_count: updatedReviews.length,
        };
      });
    } catch (err) {
      alert(err.response?.data?.error || "Lỗi khi gửi đánh giá!");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Chủ shop phản hồi
  const handleReplyReview = async (reviewId) => {
    const replyText = replyInputs[reviewId];
    if (!replyText || !replyText.trim()) return;

    const token = localStorage.getItem("ecotrace_token");
    try {
      const res = await axios.post(
        `http://localhost:8000/api/products/${id}/reply-review/`,
        {
          review_id: reviewId,
          reply: replyText.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      alert("Đã gửi phản hồi đến khách hàng!");
      setReplyInputs((prev) => ({ ...prev, [reviewId]: "" }));

      setProduct((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          reviews: prev.reviews.map((r) => (r.id === reviewId ? res.data : r)),
        };
      });
    } catch (err) {
      alert(err.response?.data?.error || "Lỗi khi gửi phản hồi!");
    }
  };

  if (loading)
    return (
      <div className="text-center py-24 text-gray-400 font-medium text-xs">
        Đang tải dữ liệu nông sản...
      </div>
    );
  if (!product)
    return (
      <div className="text-center py-24 text-gray-500 font-bold">
        Không tìm thấy sản phẩm.
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 font-sans space-y-10">
      {/* Nút quay lại thông minh */}
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-emerald-700 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>

      {/* CHI TIẾT NÔNG SẢN */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="rounded-2xl overflow-hidden border border-gray-100 bg-slate-50 relative aspect-4/3">
          <img
            src={product.display_image || product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.latest_batch && (
            <span className="absolute top-3 left-3 bg-emerald-800 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Eco-Score:{" "}
              {product.latest_batch.eco_score}/100 (
              {product.latest_batch.eco_grade})
            </span>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                {product.category}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <b className="text-gray-800">{product.avg_rating ?? 5.0}</b> (
                {product.reviews?.length || 0} đánh giá)
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              {product.name}
            </h1>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Trang trại:{" "}
              <b className="text-gray-700">{product.farm_name}</b>
            </p>
          </div>

          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/60 flex items-baseline gap-3">
            <span className="text-2xl font-black text-emerald-700">
              {Number(currentVariant.price).toLocaleString()} đ
            </span>
            <span className="text-xs text-gray-500">
              quy cách:{" "}
              <b className="text-emerald-900">{currentVariant.name}</b>
            </span>
          </div>

          {/* CHỌN PHÂN LOẠI QUY CÁCH */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Chọn quy cách đóng gói:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {variantsList.map((v) => {
                const isSelected = currentVariant.name === v.name;
                return (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => {
                      setSelectedVariant(v);
                      setBuyQuantity(1);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-2xs font-bold"
                        : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <span className="text-xs">{v.name}</span>
                    <span className="text-[11px] font-extrabold text-emerald-700 mt-1">
                      {Number(v.price).toLocaleString()} đ
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* HIỂN THỊ TỒN KHO THEO ĐƠN VỊ THỰC TẾ */}
          <div className="text-xs text-gray-500 flex items-center justify-between">
            <span>
              Tồn kho vườn:{" "}
              <b className="text-gray-800">
                {stock} {baseUnit}
              </b>
            </span>
            <span>
              Đáp ứng tối đa:{" "}
              <b className="text-emerald-700">{maxCanBuy} suất</b>
            </span>
          </div>

          {/* SỐ LƯỢNG & NÚT THÊM GIỎ HÀNG */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center border border-gray-200 rounded-xl bg-slate-50 overflow-hidden">
              <button
                type="button"
                onClick={() => setBuyQuantity(Math.max(1, buyQuantity - 1))}
                className="px-3 py-2 text-sm font-bold text-gray-600 hover:bg-slate-200 cursor-pointer"
              >
                -
              </button>
              <span className="px-4 py-2 text-xs font-bold text-gray-800">
                {buyQuantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  setBuyQuantity(Math.min(maxCanBuy, buyQuantity + 1))
                }
                className="px-3 py-2 text-sm font-bold text-gray-600 hover:bg-slate-200 cursor-pointer"
              >
                +
              </button>
            </div>

            <button
              type="button"
              disabled={maxCanBuy <= 0}
              onClick={handleAddToCart}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              {maxCanBuy <= 0
                ? "Tạm thời hết hàng"
                : `Thêm vào giỏ (${(Number(currentVariant.price) * Number(buyQuantity)).toLocaleString()} đ)`}
            </button>
          </div>

          {product.latest_batch && (
            <Link
              to={`/trace/${product.latest_batch.batch_code}`}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              Xem tem truy xuất nguồn gốc & Lịch sử vi khí hậu lô{" "}
              {product.latest_batch.batch_code} 
            </Link>
          )}
        </div>
      </div>

      {/* KHỐI ĐÁNH GIÁ & PHẢN HỒI CỦA CHỦ SHOP */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-xs space-y-6">
        <div className="pb-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Đánh giá
            & Phản hồi thực tế từ khách hàng
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Điểm trung bình:{" "}
            <b className="text-gray-800">{product.avg_rating ?? 5.0}/5.0</b> (
            {product.reviews?.length || 0} lượt nhận xét)
          </p>
        </div>

        {/* Form gửi đánh giá */}
        {!isAuthenticated ? (
          <div className="bg-slate-50 p-6 rounded-2xl border border-gray-100 text-center space-y-2">
            <p className="text-xs text-gray-600">
              Bạn cần đăng nhập tài khoản để gửi đánh giá cho nông sản này.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
            >
              <LogIn className="w-3.5 h-3.5" /> Đăng nhập ngay
            </Link>
          </div>
        ) : product.user_has_reviewed ? (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Bạn đã gửi đánh giá cho sản phẩm này. Mỗi tài khoản chỉ được đánh
            giá 1 lần để đảm bảo tính khách quan.
          </div>
        ) : (
          <form
            onSubmit={handleSubmitReview}
            className="bg-slate-50/70 p-4 rounded-2xl border border-gray-100 space-y-3"
          >
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">
                Mức độ hài lòng của bạn:
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingInput(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${star <= ratingInput ? "fill-amber-400" : "text-gray-300"}`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-amber-600">
                {ratingInput} sao
              </span>
            </div>

            <textarea
              required
              rows="2"
              placeholder="Chia sẻ trải nghiệm thực tế về độ tươi ngon, chất lượng quy cách..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="w-full text-xs p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
            />

            <button
              type="submit"
              disabled={submittingReview}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            >
              {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </form>
        )}

        {/* Danh sách đánh giá & Phản hồi của chủ shop */}
        <div className="space-y-4">
          {!product.reviews || product.reviews.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">
              Chưa có đánh giá nào cho sản phẩm này.
            </p>
          ) : (
            product.reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 bg-white border border-gray-100 rounded-2xl shadow-2xs space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-800">
                    {rev.customer_name}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-3 h-3 text-amber-400 fill-amber-400"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-600">{rev.comment}</p>
                <span className="text-[10px] text-gray-400 block">
                  {new Date(rev.created_at).toLocaleDateString("vi-VN")}
                </span>

                {/* Phản hồi từ chủ shop */}
                {rev.shop_reply && (
                  <div className="mt-2 pl-4 border-l-2 border-emerald-500 bg-emerald-50/50 p-3 rounded-r-xl space-y-1">
                    <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                      <CornerDownRight className="w-3.5 h-3.5 text-emerald-600" />{" "}
                      Phản hồi từ Chủ trang trại:
                    </span>
                    <p className="text-xs text-gray-700">{rev.shop_reply}</p>
                  </div>
                )}

                {/* Form trả lời của chủ shop */}
                {product.is_owner && !rev.shop_reply && (
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Chủ vườn phản hồi đánh giá này..."
                      value={replyInputs[rev.id] || ""}
                      onChange={(e) =>
                        setReplyInputs({
                          ...replyInputs,
                          [rev.id]: e.target.value,
                        })
                      }
                      className="flex-1 text-[11px] p-2 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleReplyReview(rev.id)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition shrink-0 shadow-2xs cursor-pointer"
                    >
                      Trả lời
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* GỢI Ý CÙNG TRANG TRẠI & CÙNG DANH MỤC */}
      {recommendations.same_farm && recommendations.same_farm.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" /> Nông sản khác
              cùng trang trại {product.farm_name}
            </h3>
            <span className="text-xs text-gray-400">Gom đơn cùng nhà vườn</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendations.same_farm.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.slug || p.id}`}
                className="bg-white rounded-2xl p-3 border border-gray-100 shadow-2xs hover:shadow-xs transition group flex flex-col justify-between"
              >
                <div>
                  <img
                    src={p.display_image || p.image_url}
                    alt={p.name}
                    className="w-full h-32 object-cover rounded-xl bg-slate-50 group-hover:scale-102 transition duration-300"
                  />
                  <h4 className="text-xs font-bold text-gray-900 mt-2 truncate">
                    {p.name}
                  </h4>
                  <span className="text-[10px] text-gray-400">
                    {p.category}
                  </span>
                </div>
                <p className="text-xs font-extrabold text-emerald-700 mt-2">
                  {Number(p.price).toLocaleString()} đ{" "}
                  <span className="font-normal text-gray-400 text-[10px]">
                    /{p.unit}
                  </span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {recommendations.same_category &&
        recommendations.same_category.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" /> Nông sản cùng
                danh mục "{product.category}"
              </h3>
              <span className="text-xs text-gray-400">Được gợi ý cho bạn</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recommendations.same_category.map((p) => (
                <Link
                  key={p.id}
                  to={`/product/${p.slug || p.id}`}
                  className="bg-white rounded-2xl p-3 border border-gray-100 shadow-2xs hover:shadow-xs transition group flex flex-col justify-between"
                >
                  <div>
                    <img
                      src={p.display_image || p.image_url}
                      alt={p.name}
                      className="w-full h-32 object-cover rounded-xl bg-slate-50 group-hover:scale-102 transition duration-300"
                    />
                    <h4 className="text-xs font-bold text-gray-900 mt-2 truncate">
                      {p.name}
                    </h4>
                    <span className="text-[10px] text-gray-500 truncate block">
                      Trang trại: {p.farm_name}
                    </span>
                  </div>
                  <p className="text-xs font-extrabold text-emerald-700 mt-2">
                    {Number(p.price).toLocaleString()} đ{" "}
                    <span className="font-normal text-gray-400 text-[10px]">
                      /{p.unit}
                    </span>
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}