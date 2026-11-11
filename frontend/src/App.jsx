import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Link,
  NavLink,
  Navigate,
} from "react-router-dom";
import { CartProvider, useCart } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import ProductList from "./pages/ProductList";
import FarmsList from "./pages/FarmsList";
import BatchTrace from "./pages/BatchTrace";
import OrderLookup from "./pages/OrderLookup";
import FarmDashboard from "./pages/FarmDashboard";
import CartDrawer from "./components/CartDrawer";
import QrScannerModal from "./components/QrScannerModal";
import AuthModal from "./components/AuthModal";
import FarmDetail from "./pages/FarmDetail";
import ProductDetail from "./pages/ProductDetail";
import CustomerProfile from "./pages/CustomerProfile";
import BlogList from "./pages/BlogList";
import BlogDetail from "./pages/BlogDetail";
import {
  ShoppingCart,
  Leaf,
  QrCode,
  Search,
  Package,
  LayoutDashboard,
  LogOut,
  LogIn,
} from "lucide-react";

function Navbar({ onOpenCart, onOpenScanner, onOpenAuth }) {
  const { cartItems } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const navigate = useNavigate();
  const totalCount = (cartItems || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/trace/${searchInput.trim()}`);
      setSearchInput("");
    }
  };

  const navLinkClass = ({ isActive }) =>
    `pb-1 transition shrink-0 text-xs md:text-sm font-bold tracking-wide ${
      isActive
        ? "text-emerald-700 border-b-2 border-emerald-600"
        : "text-gray-600 hover:text-emerald-700"
    }`;

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      {/* 1. Dải thông báo trên cùng */}
      <div className="bg-emerald-900 text-emerald-200 text-[10px] py-1 px-4 text-center font-medium hidden sm:block">
        🌿 EcoTrace — Nông sản sạch minh bạch nguồn gốc & giám sát vi khí hậu
        thời gian thực
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 font-sans">
        {/* 2. Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Leaf className="w-6 h-6 text-emerald-600" />
          <span className="font-extrabold text-lg text-gray-900 tracking-tight">
            EcoTrace
          </span>
        </Link>

        {/* 3. Menu điều hướng trên Desktop (Ẩn khi ở màn hình điện thoại để tránh đè logo) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold">
          <NavLink to="/" className={navLinkClass}>
            TRANG CHỦ
          </NavLink>
          <NavLink to="/products" className={navLinkClass}>
            SẢN PHẨM
          </NavLink>
          <NavLink to="/farms" className={navLinkClass}>
            NHÀ VƯỜN
          </NavLink>
          <NavLink to="/blog" className={navLinkClass}>
            BLOG
          </NavLink>
        </nav>

        {/* 4. Ô quét mã lô & Tem QR */}
        <div className="hidden lg:flex items-center gap-2 max-w-xs flex-1">
          <form onSubmit={handleSearch} className="relative flex-1">
            <input
              type="text"
              placeholder="Nhập mã lô (VD: LOT-01)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-full focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
          </form>

          <button
            type="button"
            onClick={onOpenScanner}
            title="Quét mã QR tem nông sản"
            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full transition flex items-center justify-center cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>

        {/* 5. Cụm Tiện ích: Đơn hàng, Giỏ hàng, Quản trị & Tài khoản */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Nút Quét tem trên điện thoại */}
          <button
            type="button"
            onClick={onOpenScanner}
            title="Quét tem QR"
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition flex lg:hidden cursor-pointer"
          >
            <QrCode className="w-5 h-5 text-emerald-700" />
          </button>

          {/* Nút Tra cứu Đơn hàng */}
          <Link
            to="/orders"
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition relative cursor-pointer"
            title="Tra cứu đơn hàng"
          >
            <Package className="w-5 h-5" />
          </Link>

          {/* Nút Giỏ hàng */}
          <button
            type="button"
            onClick={onOpenCart}
            className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer"
            title="Giỏ hàng"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalCount}
              </span>
            )}
          </button>

          {/* Cổng điều hành nông trại: FARMER/ADMIN */}
          {user?.role === "FARMER" || user?.role === "ADMIN" ? (
            <Link
              to="/dashboard"
              className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
              title="Cổng điều hành nông trại"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Trang trại</span>
            </Link>
          ) : null}

          {/* Tài khoản người dùng */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1 sm:gap-2 pl-2 border-l border-gray-200">
              <Link
                to="/profile"
                className="flex items-center gap-1.5 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 transition group cursor-pointer"
                title="Hồ sơ cá nhân & Đơn hàng đã đặt"
              >
                <div className="w-7 h-7 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                  {user?.username ? user.username[0] : "U"}
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-gray-800 group-hover:text-emerald-700 transition leading-none">
                    {user?.username}
                  </p>
                  <span className="text-[10px] font-semibold text-emerald-600 uppercase">
                    {user?.role}
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={logout}
                title="Đăng xuất"
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-full transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-full transition shadow-xs cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </button>
          )}
        </div>
      </div>

      {/* Thanh menu phụ trên di động: chữ nhỏ gọn, tracking thoáng và padding mỏng */}
      <div className="flex md:hidden border-t border-gray-100 px-2 py-1.5 justify-around items-center bg-white text-[11px] font-semibold text-gray-500 tracking-wider uppercase">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `pb-0.5 transition ${
              isActive
                ? "text-emerald-700 border-b-2 border-emerald-600 font-bold"
                : "hover:text-emerald-700"
            }`
          }
        >
          Trang chủ
        </NavLink>
        <NavLink
          to="/products"
          className={({ isActive }) =>
            `pb-0.5 transition ${
              isActive
                ? "text-emerald-700 border-b-2 border-emerald-600 font-bold"
                : "hover:text-emerald-700"
            }`
          }
        >
          Sản phẩm
        </NavLink>
        <NavLink
          to="/farms"
          className={({ isActive }) =>
            `pb-0.5 transition ${
              isActive
                ? "text-emerald-700 border-b-2 border-emerald-600 font-bold"
                : "hover:text-emerald-700"
            }`
          }
        >
          Nhà vườn
        </NavLink>
        <NavLink
          to="/blog"
          className={({ isActive }) =>
            `pb-0.5 transition ${
              isActive
                ? "text-emerald-700 border-b-2 border-emerald-600 font-bold"
                : "hover:text-emerald-700"
            }`
          }
        >
          Blog
        </NavLink>
      </div>
    </header>
  );
}

// Bọc Route bảo vệ cho Chủ Trang Trại
function ProtectedFarmRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated || (user?.role !== "FARMER" && user?.role !== "ADMIN")) {
    alert("Khu vực này chỉ dành cho Chủ trang trại hoặc Quản trị viên.");
    return <Navigate to="/" replace />;
  }
  return children;
}

function MainLayout() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const navigate = useNavigate();

  const handleScanSuccess = (batchCode) => {
    setIsScannerOpen(false);
    navigate(`/trace/${batchCode}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="flex-1">
        <Routes>
          {/* Trang chủ */}
          <Route
            path="/"
            element={<Home onOpenScanner={() => setIsScannerOpen(true)} />}
          />

          {/* Sàn nông sản */}
          <Route
            path="/products"
            element={
              <ProductList
                onSelectTrace={(code) => navigate(`/trace/${code}`)}
              />
            }
          />

          {/* Danh sách nhà vườn */}
          <Route path="/farms" element={<FarmsList />} />

          {/* Chi tiết nông sản */}
          <Route path="/product/:id" element={<ProductDetail />} />

          {/* Tem QR truy xuất lô hàng */}
          <Route path="/trace/:batchCode" element={<BatchTrace />} />

          {/* Tra cứu đơn hàng */}
          <Route path="/orders" element={<OrderLookup />} />

          {/* Chi tiết trang trại */}
          <Route path="/farm/:id" element={<FarmDetail />} />

          {/* Hồ sơ cá nhân */}
          <Route path="/profile" element={<CustomerProfile />} />

          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />

          {/* Quản lý trang trại */}
          <Route
            path="/dashboard"
            element={
              <ProtectedFarmRoute>
                <FarmDashboard />
              </ProtectedFarmRoute>
            }
          />
        </Routes>
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <MainLayout />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
