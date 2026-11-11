import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, Calendar, Eye, ArrowRight, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { key: 'ALL', label: 'Tất cả chủ đề' },
  { key: 'FARM_STORY', label: 'Nhật ký nông hộ' },
  { key: 'VIETGAP_TECH', label: 'Quy trình VietGAP' },
  { key: 'EAT_CLEAN', label: 'Eat-Clean & Món ngon' },
  { key: 'KNOWLEDGE', label: 'Kiến thức nông sản' },
];

export default function BlogList() {
  const [posts, setPosts] = useState([]);
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:8000/api/posts/')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setPosts(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredPosts = selectedCat === 'ALL' 
    ? posts 
    : posts.filter(p => p.category === selectedCat);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 font-sans space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Góc Kiến Thức Nông Nghiệp Xanh
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            Nhật ký canh tác & Bí quyết sống khỏe
          </h1>
          <p className="text-emerald-100/90 text-xs md:text-sm leading-relaxed">
            Khám phá quy trình VietGAP, theo dõi hành trình tạo nên từng mớ rau hữu cơ sạch và bỏ túi những công thức Eat-Clean bổ dưỡng.
          </p>
        </div>
      </div>

      {/* Bộ lọc chuyên mục */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setSelectedCat(c.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedCat === c.key 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-slate-50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Danh sách bài viết */}
      {loading ? (
        <div className="text-center py-20 text-xs text-gray-400">Đang tải các bài viết...</div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 space-y-2">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-xs text-gray-500">Chưa có bài viết nào thuộc chuyên mục này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredPosts.map(post => (
            <article 
              key={post.id} 
              className="bg-white rounded-3xl border border-gray-100 shadow-2xs hover:shadow-md transition overflow-hidden flex flex-col justify-between group"
            >
              <div 
                className="cursor-pointer"
                onClick={() => navigate(`/blog/${post.slug || post.id}`)}
              >
                <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                  <img 
                    src={post.display_image} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                  />
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-2xs text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-2xs">
                    {post.category_display || post.category}
                  </span>
                </div>

                <div className="p-5 space-y-2.5">
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {new Date(post.created_at).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {post.views_count} lượt đọc
                    </span>
                  </div>

                  <h2 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition line-clamp-2 leading-snug">
                    {post.title}
                  </h2>

                  <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-gray-50 flex items-center justify-between mt-2">
                {/* Tên nhà vườn có link bấm chuyển sang trang Nhà vườn */}
                <Link
                  to={`/farm/${post.farm_slug || post.farm_id || post.farm}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline truncate max-w-[150px]"
                  title="Xem thông tin nhà vườn"
                >
                  Bởi: {post.farm_name}
                </Link>

                <button
                  type="button"
                  onClick={() => navigate(`/blog/${post.slug || post.id}`)}
                  className="text-xs font-bold text-gray-800 group-hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  Đọc tiếp <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}