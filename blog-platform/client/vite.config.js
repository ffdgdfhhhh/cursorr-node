import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    // 开发时请求转发到线上 API；不可达时检查本机网络与目标服务
    proxy: {
      '/api': { target: 'http://47.121.120.218', changeOrigin: true },
      '/uploads': { target: 'http://47.121.120.218', changeOrigin: true },
    },
  },
});
