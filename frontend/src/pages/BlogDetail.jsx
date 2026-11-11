import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Calendar, Eye, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Điều hướng lùi trang linh hoạt
  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/blog");
    }
  };

  let addToCart = () => {};
  try {
    const cartContext = useCart();
    if (cartContext && cartContext.addToCart) {
      addToCart = cartContext.addToCart;
    }
  } catch (e) {
    console.warn("CartContext không khả dụng:", e);
  }

  const fetchedSlugRef = useRef(null);

  useEffect(() => {
    if (fetchedSlugRef.current === slug) return;
    fetchedSlugRef.current = slug;

    setLoading(true);
    setError(false);

    axios
      .get(`http://localhost:8000/api/posts/${slug}/`)
      .then((res) => {
        setPost(res.data);
      })
      .catch((err) => {
        console.error("Lỗi tải chi tiết bài viết:", err);
        setError(true);
      })
      .finally(() => setLoading(false));

    return () => {
      fetchedSlugRef.current = null;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-xs text-gray-400">
        Đang tải bài viết...
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-3">
        <p className="text-xs text-red-500 font-semibold">
          Không tìm thấy bài viết hoặc bài viết đã bị gỡ.
        </p>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 font-sans space-y-6">
      {/* Nút quay lại linh hoạt */}
      <div>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-emerald-700 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      {/* Header bài viết */}
      <header className="space-y-3">
        <span className="inline-block text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
          {post.category_display || post.category}
        </span>

        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pb-3 border-b border-gray-100">
          <span className="flex items-center gap-1">
            Nhà vườn:
            <Link
              to={`/farm/${post.farm_slug || post.farm_id || post.farm}`}
              className="font-bold text-emerald-700 hover:underline ml-1"
            >
              {post.farm_name || "EcoTrace Farm"} 
            </Link>
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {post.created_at
              ? new Date(post.created_at).toLocaleDateString("vi-VN")
              : "Vừa xong"}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {post.views_count || 1} lượt đọc
          </span>
        </div>
      </header>

      {/* Ảnh bìa */}
      <div className="rounded-3xl overflow-hidden aspect-16/9 bg-slate-100 border border-gray-100 shadow-xs">
        <img
          src={post.display_image}
          alt={post.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80";
          }}
        />
      </div>

      {/* Đoạn tóm tắt mở đầu */}
      {post.excerpt && (
        <blockquote className="p-4 bg-emerald-50/70 border-l-4 border-emerald-600 rounded-r-2xl text-xs md:text-sm text-emerald-950 font-medium italic leading-relaxed">
          {post.excerpt}
        </blockquote>
      )}

      {/* Nội dung bài viết */}
      <div className="text-gray-700 text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-sans">
        {post.content}
      </div>

      {/* Nông sản liên quan (nếu có) */}
      {post.related_products_detail && post.related_products_detail.length > 0 && (
        <section className="bg-slate-50 p-6 rounded-3xl border border-gray-100 space-y-4 mt-8">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-900">
              Nông sản được nhắc đến trong bài viết:
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {post.related_products_detail.map((p) => (
              <div
                key={p.id}
                className="bg-white p-3 rounded-2xl border border-gray-200 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={p.display_image || p.image_url}
                    alt={p.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">{p.name}</h4>
                    <span className="text-xs font-black text-emerald-700">
                      {Number(p.price).toLocaleString()} đ
                    </span>
                    <span className="text-[10px] text-gray-400"> /{p.unit}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    addToCart({
                      id: p.id,
                      name: p.name,
                      price: p.price,
                      image_url: p.display_image || p.image_url,
                      quantity: 1,
                      unit: p.unit,
                    })
                  }
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
                >
                  Thêm giỏ
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}