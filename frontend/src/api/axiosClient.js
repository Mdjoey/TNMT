import axios from 'axios';

// Khi không set baseURL đầy đủ, Axios sẽ tự động gọi tới domain hiện tại (/api/...)
const axiosClient = axios.create({
  baseURL: '', // Để rỗng để dùng proxy tương đối
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tự động gắn token và header bỏ qua cảnh báo ngrok nếu có
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ecotrace_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Bỏ qua trang cảnh báo trình duyệt của ngrok
  config.headers['ngrok-skip-browser-warning'] = 'true';
  return config;
});

export default axiosClient;