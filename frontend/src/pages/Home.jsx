import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ShieldCheck,
  QrCode,
  Truck,
  Leaf,
  Sparkles,
  ArrowRight,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Calendar,
  Eye,
  BookOpen,
} from "lucide-react";

// Hàm làm sạch đường dẫn ảnh: loại bỏ host localhost và ký tự rác nếu có
const cleanMediaUrl = (
  url,
  fallback = "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
) => {
  if (!url) return fallback;
  let clean = String(url)
    .trim()
    .replace(/[\*\)\"\'\s]+$/, "");
  // Cắt bỏ tiền tố localhost:8000 để dùng proxy /media của Vite
  clean = clean.replace(/^http:\/\/(localhost|127\.0\.0\.1):8000/, "");
  return clean || fallback;
};

export default function Home({ onOpenScanner }) {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [farms, setFarms] = useState([]);
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Lấy nông sản nổi bật
    axios
      .get("/api/products/")
      .then((res) =>
        setFeaturedProducts((res.data.results || res.data || []).slice(0, 4)),
      )
      .catch(console.error);

    // 2. Lấy nhà vườn đối tác
    axios
      .get("/api/farms/")
      .then((res) => setFarms((res.data.results || res.data || []).slice(0, 3)))
      .catch(console.error);

    // 3. Lấy 3 bài viết mới nhất từ Database
    axios
      .get("/api/posts/")
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.results || [];
        setPosts(data.slice(0, 3));
      })
      .catch(console.error);
  }, []);

  return (
    <div className="font-sans space-y-8 pb-16 bg-slate-50/50">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white py-16 md:py-24 px-6">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" /> Nông nghiệp thông minh & Minh
              bạch sinh thái
            </span>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Nông sản tươi lành <br />
              <span className="text-emerald-400">tận vườn sinh thái</span>
            </h1>

            <p className="text-emerald-100 text-sm md:text-base leading-relaxed max-w-lg">
              Trực tiếp từ các nông trại chuẩn VietGAP. Quét mã QR để xem ngay
              nhật ký canh tác, độ phì của đất và chỉ số vi khí hậu IoT theo
              thời gian thực.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/products"
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs md:text-sm rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                Khám phá nông sản <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={onOpenScanner}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs md:text-sm rounded-xl backdrop-blur-md border border-white/20 transition flex items-center gap-2 cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-emerald-400" /> Quét tem lô hàng
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="relative mx-auto max-w-sm rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 bg-slate-800">
              <img
                src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80"
                alt="EcoTrace Fresh"
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Eco-Score: 100/100 (Hạng
                    A)
                  </span>
                  <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                    VietGAP
                  </span>
                </div>
                <p className="text-xs text-emerald-100 mt-1">
                  Dữ liệu vi khí hậu IoT tự động ghi nhận tại Mộc Châu & Đà Lạt
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THANH CAM KẾT VÀNG */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">
                100% Chuẩn VietGAP
              </h4>
              <p className="text-[11px] text-gray-400">
                Canh tác sạch & an toàn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">
                Minh bạch mã lô
              </h4>
              <p className="text-[11px] text-gray-400">
                Quét tem QR truy xuất tức thì
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">
                Giao tươi trong ngày
              </h4>
              <p className="text-[11px] text-gray-400">
                Thu hoạch & vận chuyển nhanh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">
                Thanh toán COD
              </h4>
              <p className="text-[11px] text-gray-400">
                Kiểm tra nông sản khi nhận
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. NÔNG SẢN NỔI BẬT */}
      <section className="max-w-6xl mx-auto px-6 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Mùa vụ mới
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
              Nông sản thu hoạch hôm nay
            </h2>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
          >
            Xem tất cả nông sản <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {featuredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/product/${p.slug || p.id}`)}
              className="bg-white rounded-2xl border border-gray-100 shadow-2xs hover:shadow-md transition p-3 flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 mb-3">
                  <img
                    src={cleanMediaUrl(p.display_image || p.image_url)}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  {p.latest_batch && (
                    <span className="absolute top-2 left-2 bg-emerald-800/80 backdrop-blur-2xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Eco {p.latest_batch.eco_score} ({p.latest_batch.eco_grade}
                      )
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {p.category}
                </span>
                <h3 className="text-xs font-bold text-gray-900 mt-1.5 truncate group-hover:text-emerald-700 transition">
                  {p.name}
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                  Trang trại: {p.farm_name}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-emerald-700">
                    {Number(p.price).toLocaleString()} đ
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    {" "}
                    /{p.unit}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                  Chi tiết →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. NHÀ VƯỜN ĐỐI TÁC */}
      <section className="max-w-6xl mx-auto px-6 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Hợp tác xã & Nông hộ
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
              Các nhà vườn sinh thái tiêu biểu
            </h2>
          </div>
          <Link
            to="/farms"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
          >
            Xem tất cả nhà vườn <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {farms.map((f) => {
            const count = f.products_count ?? (f.products?.length || 0);
            const farmIdentifier = f.slug || f.id;

            return (
              <div
                key={f.id}
                onClick={() => navigate(`/farm/${farmIdentifier}`)}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                        {f.vietgap_cert_id || "Chuẩn VietGAP"}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-2 group-hover:text-emerald-700 transition">
                        {f.name}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm shadow-xs">
                      {f.name ? f.name[0] : "F"}
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mt-2">
                    {f.description ||
                      "Trang trại sinh thái ứng dụng quy trình hữu cơ và giám sát vi khí hậu IoT."}
                  </p>

                  <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-3">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{f.address}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                  <span className="text-[11px] font-semibold text-gray-600">
                    <b className="text-emerald-700 font-bold">{count}</b> sản
                    phẩm mở bán
                  </span>
                  <span className="px-3 py-1.5 bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white rounded-xl text-xs font-bold text-gray-700 transition flex items-center gap-1">
                    Xem trang trại →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. GÓC KIẾN THỨC & BLOG SỐNG XANH */}
      <section className="max-w-6xl mx-auto px-6 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Cẩm nang Eat-Clean
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
              Kiến thức nông sản & Sống khỏe
            </h2>
          </div>
          <Link
            to="/blog"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
          >
            Xem thêm bài viết <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-gray-100 p-6 space-y-2">
            <BookOpen className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs text-gray-400">
              Các chủ nhà vườn đang cập nhật các bài viết mới...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article
                key={post.id}
                onClick={() => navigate(`/blog/${post.slug || post.id}`)}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-2xs hover:shadow-md transition group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                    <img
                      src={cleanMediaUrl(
                        post.display_image || post.image || post.thumbnail,
                      )}
                      alt={post.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    <span className="absolute top-2.5 left-2.5 bg-white/95 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                      {post.category_display || post.category}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{" "}
                        {new Date(post.created_at).toLocaleDateString("vi-VN")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {post.views_count} lượt đọc
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-gray-900 group-hover:text-emerald-700 transition line-clamp-2 leading-snug">
                      {post.title}
                    </h3>

                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 text-[11px] font-bold text-emerald-600 flex items-center justify-between border-t border-gray-50 mt-2">
                  <Link
                    to={`/farm/${post.farm_slug || post.farm_id || post.farm}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-emerald-700 hover:text-emerald-900 hover:underline truncate max-w-[130px]"
                    title="Xem hồ sơ nông trại"
                  >
                    Bởi: {post.farm_name}
                  </Link>
                  <span
                    onClick={() => navigate(`/blog/${post.slug || post.id}`)}
                    className="group-hover:translate-x-1 transition flex items-center gap-0.5 cursor-pointer text-gray-700 hover:text-emerald-700"
                  >
                    Đọc tiếp <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
