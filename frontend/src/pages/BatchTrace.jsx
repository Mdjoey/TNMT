import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Activity, ArrowLeft } from "lucide-react";
import FarmMap from "../components/FarmMap";

export default function BatchTrace() {
  const { batchCode } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Điều hướng lùi trang linh hoạt, tránh bị ép về trang chủ
  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/products");
    }
  };

  useEffect(() => {
    if (!batchCode) return;
    setLoading(true);
    setError(null);

    axios
      .get(`http://localhost:8000/api/batches/${batchCode}/`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(`Không tìm thấy dữ liệu cho mã lô: ${batchCode}`);
        setLoading(false);
      });
  }, [batchCode]);

  if (loading)
    return (
      <div className="text-center py-20 text-gray-500 font-medium text-xs">
        Đang tải thông tin sinh thái...
      </div>
    );

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center py-16">
        <p className="text-red-500 font-medium mb-4 text-xs">{error}</p>
        <button
          type="button"
          onClick={handleBack}
          className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition cursor-pointer"
        >
          ← Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 font-sans">
      {/* Nút quay lại linh hoạt */}
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>

      {/* Header truy xuất */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-xs font-bold tracking-wider text-green-700 uppercase bg-green-50 px-3 py-1 rounded-full">
            Chứng nhận truy xuất VietGAP
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            {data.product.name}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Mã định danh lô:{" "}
            <span className="font-semibold text-gray-800">
              {data.batch_code}
            </span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Trang trại:{" "}
            {data.product?.farm_id ? (
              <Link
                to={`/farm/${data.product.farm_id}`}
                className="text-emerald-700 font-bold hover:underline"
              >
                {data.product?.farm_name || data.product?.farm?.name}
              </Link>
            ) : (
              <span className="font-semibold text-gray-700">
                {data.product?.farm?.name}
              </span>
            )}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            {data.product.farm.address}
          </p>
        </div>

        <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="text-center">
            <span className="text-xs text-gray-500 font-medium">
              Chỉ số sinh thái
            </span>
            <div className="text-3xl font-extrabold text-emerald-600 mt-1">
              {data.eco_score}
              <span className="text-lg text-gray-400">/100</span>
            </div>
            <div className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 mt-1 inline-block">
              Hạng {data.eco_grade}
            </div>
          </div>
          {data.qr_code_image && (
            <img
              src={data.qr_code_image}
              alt="QR Code"
              className="w-20 h-20 rounded-lg border border-gray-200 shadow-sm"
            />
          )}
        </div>
      </div>

      {/* Thông số canh tác */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-gray-400 text-xs font-medium">
            Ngày xuống giống
          </div>
          <div className="text-gray-800 font-bold mt-1">
            {data.planting_date || "01/09/2026"}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-gray-400 text-xs font-medium">
            Ngày thu hoạch
          </div>
          <div className="text-gray-800 font-bold mt-1">
            {data.harvest_date}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-gray-400 text-xs font-medium">Sản lượng lô</div>
          <div className="text-gray-800 font-bold mt-1">
            {data.quantity} {data.product.unit}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-gray-400 text-xs font-medium">Giá niêm yết</div>
          <div className="text-emerald-700 font-bold mt-1">
            {Number(data.product.price).toLocaleString()} đ
          </div>
        </div>
      </div>

      {/* Biểu đồ Recharts */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          Lịch sử điều kiện vi khí hậu & thổ nhưỡng
        </h2>
        <p className="text-gray-500 text-xs mb-6">
          Dữ liệu quan trắc chuỗi thời gian đối chiếu theo dải ngưỡng VietGAP
        </p>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.env_records}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="recorded_date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="temperature"
                name="Nhiệt độ (°C)"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="humidity"
                name="Độ ẩm khí (%)"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="soil_moisture"
                name="Độ ẩm đất (%)"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="soil_ph"
                name="Độ pH đất"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <FarmMap farm={data.product.farm} />
    </div>
  );
}