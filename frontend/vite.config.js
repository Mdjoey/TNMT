import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true, // Cho phép host ngrok truy cập
    proxy: {
      // Bất kỳ request nào bắt đầu bằng /api sẽ được chuyển tiếp ngầm sang Django cổng 8000
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      // Bất kỳ link ảnh media nào bắt đầu bằng /media cũng được chuyển sang Django
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})