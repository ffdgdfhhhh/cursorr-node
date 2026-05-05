import axios from 'axios';
import { getToken } from '../utils/authStorage';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '',
  timeout: 30000,
});

/** 登录/注册失败也会返回 401，不能当作「令牌失效」清空会话 */
function isAuthLoginOrRegister(config) {
  const url = config.url || '';
  return (
    (url.includes('/api/auth/login') || url.includes('/api/auth/register')) &&
    !url.includes('/api/auth/me')
  );
}

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err.response?.status;
    const cfg = err.config;
    if (status === 401 && cfg && !isAuthLoginOrRegister(cfg)) {
      try {
        const { useAuthStore } = await import('../stores/auth');
        useAuthStore().logout();
      } catch {
        const { clearAuthStorage, clearScheduledTokenExpiry } = await import('../utils/authStorage');
        clearScheduledTokenExpiry();
        clearAuthStorage();
      }
      const mod = await import('../router');
      const router = mod.default;
      const cur = router.currentRoute.value;
      if (cur.meta.requiresAuth) {
        router.replace({
          path: '/login',
          query: {
            redirect: cur.fullPath,
            expired: '1',
          },
        });
      }
    }
    return Promise.reject(err);
  }
);

export default http;
