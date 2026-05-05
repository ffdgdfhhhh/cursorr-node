import { defineStore } from 'pinia';
import { fetchMe, login as apiLogin, register as apiRegister } from '../api/auth';
import {
  clearAuthStorage,
  clearScheduledTokenExpiry,
  getStoredUserRaw,
  getToken,
  scheduleTokenExpiry,
  setStoredUser,
  setToken,
} from '../utils/authStorage';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: getToken(),
    loaded: false,
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
  },
  actions: {
    persist(token, user) {
      this.token = token;
      this.user = user;
      setToken(token);
      setStoredUser(user);
      clearScheduledTokenExpiry();
      scheduleTokenExpiry(() => {
        this.sessionTimedOut();
      });
    },
    restoreFromStorage() {
      this.token = getToken();
      const raw = getStoredUserRaw();
      if (raw) {
        try {
          this.user = JSON.parse(raw);
        } catch {
          this.user = null;
        }
      }
      if (this.token) {
        clearScheduledTokenExpiry();
        scheduleTokenExpiry(() => {
          this.sessionTimedOut();
        });
      }
    },
    logout() {
      clearScheduledTokenExpiry();
      this.token = null;
      this.user = null;
      this.loaded = false;
      clearAuthStorage();
    },
    /** JWT 到点：清会话；若当前为需登录页则回登录（公开页仅静默登出） */
    async sessionTimedOut() {
      clearScheduledTokenExpiry();
      if (!this.token) return;
      this.logout();
      const { default: router } = await import('../router');
      const cur = router.currentRoute.value;
      if (cur.path === '/login' || !cur.meta.requiresAuth) return;
      await router.replace({
        path: '/login',
        query: {
          redirect: cur.fullPath,
          expired: '1',
        },
      });
    },
    async login(payload) {
      const { data } = await apiLogin(payload);
      if (data.success && data.data) {
        this.persist(data.data.token, data.data.user);
      }
      return data;
    },
    async register(payload) {
      const { data } = await apiRegister(payload);
      if (data.success && data.data) {
        this.persist(data.data.token, data.data.user);
      }
      return data;
    },
    async loadMe() {
      if (!this.token) {
        this.loaded = true;
        return null;
      }
      try {
        const { data } = await fetchMe();
        if (data.success && data.data) {
          this.user = data.data;
          setStoredUser(data.data);
        }
      } catch (e) {
        const status = e.response?.status;
        if (status === 401) {
          clearScheduledTokenExpiry();
          this.logout();
        }
      } finally {
        this.loaded = true;
      }
      return this.user;
    },
  },
});
