import React, { useEffect, useState, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { ShoppingCart, Award, ArrowUpRight, Search, SlidersHorizontal, RotateCcw, Info, Plus, Minus } from 'lucide-react';

const CATEGORIES = ['Tất cả', 'Rau ăn lá', 'Củ quả', 'Trái cây', 'Nấm thực phẩm'];
const ECO_GRADES = ['Tất cả', 'A', 'B', 'C'];
const SORT_OPTIONS = [
  { value: 'default', label: 'Mặc định' },
  { value: 'eco-desc', label: 'Eco cao nhất' },
  { value: 'price-asc', label: 'Giá tăng dần' },
  { value: 'price-desc', label: 'Giá giảm dần' },
];

// Hàm làm sạch URL ảnh media để đi qua Vite proxy
const cleanMediaUrl = (url, fallback = "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80") => {
  if (!url) return fallback;
  let clean = String(url).trim().replace(/[\*\)\"\'\s]+$/, "");
  clean = clean.replace(/^http:\/\/(localhost|127\.0\.0\.1):8000/, "");
  return clean || fallback;
};

export default function ProductList({ onSelectTrace }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { cartItems, addToCart, updateQuantity } = useContext(CartContext);
  const [selectedVariants, setSelectedVariants] = useState({});

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedGrade, setSelectedGrade] = useState('Tất cả');
  const [sortBy, setSortBy] = useState('default');

  const getVariantsForProduct = (product) => {
    if (product.variants && product.variants.length > 0) {
      return product.variants;
    }
    const unit = (product.unit || 'kg').trim().toLowerCase();
    const basePrice = Number(product.price || 0);

    if (['hộp', 'khay', 'túi', 'trái', 'quả', 'bắp', 'bó', 'chùm'].includes(unit)) {
      return [
        { name: `1 ${product.unit}`, multiplier_kg: 1, price: basePrice },
        { name: `Combo 3 ${product.unit}`, multiplier_kg: 3, price: Math.round(basePrice * 2.9) },
        { name: `Combo 5 ${product.unit}`, multiplier_kg: 5, price: Math.round(basePrice * 4.7) },
      ];
    } else if (unit === 'g') {
      return [
        { name: 'Gói 100g', multiplier_kg: 100, price: Math.round(basePrice * 100) },
        { name: 'Gói 250g', multiplier_kg: 250, price: Math.round(basePrice * 250) },
        { name: 'Gói 500g', multiplier_kg: 500, price: Math.round(basePrice * 480) },
      ];
    }
    return [
      { name: 'Gói 500g', multiplier_kg: 0.5, price: Math.round(basePrice * 0.55) },
      { name: 'Túi 1 kg', multiplier_kg: 1.0, price: basePrice },
      { name: 'Combo 3 kg', multiplier_kg: 3.0, price: Math.round(basePrice * 2.85) },
    ];
  };

  const fetchProducts = () => {
    // Dùng đường dẫn tương đối để đi qua Vite proxy
    axios.get('/api/products/')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setProducts(data);

        const initialVariants = {};
        data.forEach(p => {
          const variants = getVariantsForProduct(p);
          initialVariants[p.id] = variants[0];
        });
        setSelectedVariants(initialVariants);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const farmName = p.farm_name || p.farm?.name || '';
        const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          farmName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategory = selectedCategory === 'Tất cả' || p.category === selectedCategory;
        const matchGrade = selectedGrade === 'Tất cả' || p.latest_batch?.eco_grade === selectedGrade;

        return matchSearch && matchCategory && matchGrade;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
        if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
        if (sortBy === 'eco-desc') {
          return (b.latest_batch?.eco_score || 0) - (a.latest_batch?.eco_score || 0);
        }
        return 0;
      });
  }, [products, searchTerm, selectedCategory, selectedGrade, sortBy]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('Tất cả');
    setSelectedGrade('Tất cả');
    setSortBy('default');
  };

  const getCartItem = (product) => {
    const currentVariant = selectedVariants[product.id];
    const targetVariantName = currentVariant?.name || '';
    return (cartItems || []).find(item => 
      item.id === product.id && 
      (item.variant_name === targetVariantName || !item.variant_name)
    );
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    
    const fullVariants = getVariantsForProduct(product);
    const activeVariant = selectedVariants[product.id] || fullVariants[0];
    const basePrice = Number(product.price || 0);

    const multiplier = Number(activeVariant?.multiplier_kg || activeVariant?.multiplier || 1);
    const variantName = activeVariant?.name || `${product.unit || 'kg'}`;
    const price = Number(activeVariant?.price || basePrice);

    const farmId = product.farm?.id || product.farm_id || (typeof product.farm === 'number' ? product.farm : null) || 'default_farm';
    const farmName = product.farm?.name || product.farm_name || 'Nông Trại Shop';

    addToCart({
      id: product.id,
      name: product.name,
      base_price: basePrice,
      price: price,
      multiplier_kg: multiplier,
      variant_name: variantName,
      unit: product.unit,
      display_image: cleanMediaUrl(product.display_image || product.image_url),
      farm_id: farmId,
      farm_name: farmName,
      available_variants: fullVariants,
      quantity: 1,
    });
  };

  if (loading) return <div className="text-center py-20 text-gray-500 font-medium text-xs">Đang tải nông sản VietGAP...</div>;

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 font-sans space-y-4">
      {/* Tiêu đề trang */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Nông sản sạch chuẩn VietGAP</h1>
        <p className="text-gray-500 text-[11px] sm:text-xs mt-0.5">Minh bạch nguồn gốc xuất xứ và dữ liệu sinh thái thời gian thực</p>
      </div>

      {/* THANH TÌM KIẾM & BỘ LỌC */}
      <div className="bg-white rounded-2xl p-3 sm:p-5 border border-gray-100 shadow-2xs space-y-3">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <input 
              type="text"
              placeholder="Tìm nông sản, trang trại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2 px-2 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-gray-700 max-w-[125px] sm:max-w-none"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Danh mục cuộn ngang mượt mà trên mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 text-xs">
          <span className="text-gray-400 font-medium shrink-0 text-[11px]">Danh mục:</span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 cursor-pointer text-[11px] ${
                selectedCategory === cat 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Hạng Eco-Score */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-gray-400 font-medium shrink-0 text-[11px]">Hạng Eco:</span>
            {ECO_GRADES.map(grade => (
              <button
                key={grade}
                type="button"
                onClick={() => setSelectedGrade(grade)}
                className={`px-2 py-0.5 rounded-md font-semibold transition shrink-0 cursor-pointer text-[11px] ${
                  selectedGrade === grade 
                    ? 'bg-emerald-700 text-white' 
                    : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                }`}
              >
                {grade === 'Tất cả' ? 'Tất cả' : `Hạng ${grade}`}
              </button>
            ))}
          </div>

          {(selectedCategory !== 'Tất cả' || selectedGrade !== 'Tất cả' || searchTerm) && (
            <button 
              type="button"
              onClick={resetFilters}
              title="Đặt lại bộ lọc"
              className="p-1 text-gray-400 hover:text-red-500 rounded-md transition shrink-0 cursor-pointer flex items-center gap-1 text-[11px]"
            >
              <RotateCcw className="w-3 h-3" /> Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* Số lượng kết quả */}
      <div className="flex justify-between items-center text-xs text-gray-400 font-medium px-1">
        <span>Hiển thị <b className="text-gray-700">{filteredProducts.length}</b> sản phẩm</span>
      </div>

      {/* LƯỚI SẢN PHẨM: 2 CỘT TRÊN MOBILE, 3 CỘT TRÊN MÁY TÍNH */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-400 text-xs">Không tìm thấy nông sản nào phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {filteredProducts.map(p => {
            const farmIdentifier = p.farm_slug || p.farm_id || p.farm?.id || p.farm;
            const farmName = p.farm_name || p.farm?.name || 'Trang trại VietGAP';
            const productIdentifier = p.slug || p.id;

            const availableVariants = getVariantsForProduct(p);
            const currentVariant = selectedVariants[p.id] || availableVariants[0];
            const currentPrice = Number(currentVariant?.price || p.price);

            const cartItem = getCartItem(p);
            const inCartQty = cartItem ? cartItem.quantity : 0;
            const uniqueCartId = cartItem?.cart_item_id || `${p.id}_${currentVariant?.name || 'default'}`;

            return (
              <div 
                key={p.id} 
                onClick={() => navigate(`/product/${productIdentifier}`)}
                className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition cursor-pointer group"
              >
                <div>
                  {/* Ảnh sản phẩm + Nhãn Eco */}
                  <div className="relative aspect-4/3 bg-gray-100 overflow-hidden">
                    <img 
                      src={cleanMediaUrl(p.display_image || p.image_url)} 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80";
                      }}
                    />
                    {p.latest_batch && (
                      <div className="absolute top-2 left-2 bg-emerald-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-full flex items-center gap-1 text-[9px] sm:text-[10px] font-bold">
                        <Award className="w-3 h-3 text-emerald-300" />
                        <span>Eco {p.latest_batch.eco_score} ({p.latest_batch.eco_grade})</span>
                      </div>
                    )}
                  </div>

                  {/* Thông tin sản phẩm */}
                  <div className="p-2.5 sm:p-4 pb-1">
                    <span className="text-[9px] sm:text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {p.category}
                    </span>
                    <h3 className="font-bold text-gray-900 mt-1 text-xs sm:text-sm group-hover:text-emerald-700 transition line-clamp-1">
                      {p.name}
                    </h3>

                    <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5 truncate">
                      Vườn:{' '}
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (farmIdentifier) navigate(`/farm/${farmIdentifier}`);
                        }} 
                        className="text-emerald-700 font-medium hover:underline"
                      >
                        {farmName}
                      </span>
                    </p>

                    {/* Menu chọn quy cách nhỏ gọn */}
                    <div 
                      onClick={(e) => e.stopPropagation()} 
                      className="mt-2 flex items-center justify-between gap-1 bg-slate-50 p-1 rounded-lg border border-gray-100"
                    >
                      <select
                        value={currentVariant?.name}
                        onChange={(e) => {
                          const found = availableVariants.find(v => v.name === e.target.value);
                          if (found) {
                            setSelectedVariants(prev => ({ ...prev, [p.id]: found }));
                          }
                        }}
                        className="w-full text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-white border border-gray-200 rounded-md px-1.5 py-1 outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        {availableVariants.map(v => (
                          <option key={v.name} value={v.name}>{v.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Đơn giá */}
                    <div className="text-emerald-700 font-extrabold text-xs sm:text-sm mt-2 flex items-baseline justify-between">
                      <span>{currentPrice.toLocaleString()} đ</span>
                      <span className="text-[9px] text-gray-400 font-normal truncate max-w-[65px]">
                        /{currentVariant?.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cụm nút thao tác */}
                <div className="p-2.5 sm:p-4 pt-0 mt-2">
                  <div className="pt-2 border-t border-gray-50 flex items-center gap-1.5">
                    {p.latest_batch && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectTrace) {
                            onSelectTrace(p.latest_batch.batch_code);
                          } else {
                            navigate(`/trace/${p.latest_batch.batch_code}`);
                          }
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-0.5 transition shrink-0 cursor-pointer"
                        title="Xem tem xuất xứ QR"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {inCartQty === 0 ? (
                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(e, p)}
                        className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer"
                      >
                        <ShoppingCart className="w-3 h-3" /> Mua
                      </button>
                    ) : (
                      <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="flex-1 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-0.5"
                      >
                        <button
                          type="button"
                          onClick={() => updateQuantity(uniqueCartId, inCartQty - 1)}
                          className="w-6 h-6 flex items-center justify-center bg-white text-emerald-800 rounded hover:bg-emerald-100 transition font-bold shadow-2xs cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <span className="text-[11px] font-black text-emerald-900 px-1">
                          {inCartQty}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateQuantity(uniqueCartId, inCartQty + 1)}
                          className="w-6 h-6 flex items-center justify-center bg-emerald-600 text-white rounded hover:bg-emerald-700 transition font-bold shadow-2xs cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
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
  );
}