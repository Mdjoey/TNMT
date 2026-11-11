import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { X, Lock, Mail, User, Phone, MapPin, AlertCircle } from "lucide-react";

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    role: "CUSTOMER",
    phone: "",
    address: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLoginTab) {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      setLoading(false);
      onClose();
    } catch (err) {
      setLoading(false);
      console.error("Chi tiết lỗi:", err.response?.data || err);

      const respData = err.response?.data;
      if (respData) {
        if (typeof respData === "string") {
          setError(respData);
        } else if (respData.detail) {
          setError(respData.detail);
        } else if (respData.email) {
          setError(
            Array.isArray(respData.email) ? respData.email[0] : respData.email,
          );
        } else if (respData.password) {
          setError(
            Array.isArray(respData.password)
              ? respData.password[0]
              : respData.password,
          );
        } else if (respData.non_field_errors) {
          setError(
            Array.isArray(respData.non_field_errors)
              ? respData.non_field_errors[0]
              : respData.non_field_errors,
          );
        } else {
          // Lấy key đầu tiên
          const firstKey = Object.keys(respData)[0];
          const val = respData[firstKey];
          setError(`${firstKey}: ${Array.isArray(val) ? val[0] : val}`);
        }
      } else {
        setError(
          "Không thể kết nối tới máy chủ backend. Vui lòng kiểm tra lại terminal Django.",
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative font-sans">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab chuyển đổi */}
        <div className="flex border-b border-gray-100 mb-6">
          <button
            type="button"
            onClick={() => {
              setIsLoginTab(true);
              setError("");
            }}
            className={`pb-3 font-bold text-sm flex-1 text-center transition ${
              isLoginTab
                ? "text-emerald-700 border-b-2 border-emerald-600"
                : "text-gray-400"
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLoginTab(false);
              setError("");
            }}
            className={`pb-3 font-bold text-sm flex-1 text-center transition ${
              !isLoginTab
                ? "text-emerald-700 border-b-2 border-emerald-600"
                : "text-gray-400"
            }`}
          >
            Tạo tài khoản mới
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="tenban@gmail.com"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {!isLoginTab && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Họ và tên
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Vai trò
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                >
                  <option value="CUSTOMER">Khách hàng tiêu dùng</option>
                  <option value="FARMER">Chủ trang trại VietGAP</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      placeholder="09..."
                      className="w-full pl-8 pr-2 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Địa chỉ
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                      placeholder="Quận/Huyện, Tỉnh..."
                      className="w-full pl-8 pr-2 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
          >
            {loading
              ? "Đang xử lý..."
              : isLoginTab
                ? "Đăng nhập"
                : "Tạo tài khoản ngay"}
          </button>
        </form>
      </div>
    </div>
  );
}
