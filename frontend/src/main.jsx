import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css';
import './index.css'
import App from './App.jsx'

// Import axios và cấu hình bộ chặn (interceptor)
import axios from 'axios';

axios.interceptors.request.use((config) => {
  // Tự động cắt bỏ http://localhost:8000 để chuyển thành đường dẫn tương đối
  if (config.url && config.url.startsWith('http://localhost:8000')) {
    config.url = config.url.replace('http://localhost:8000', '');
  }
  // Bỏ qua màn hình cảnh báo ban đầu của ngrok
  config.headers['ngrok-skip-browser-warning'] = 'true';
  return config;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)