/** 与历史版本保持一致，避免已登录用户被静默登出 */
export const TOKEN_KEY = 'token';
export const USER_KEY = 'user';

let expiryTimerId = null;

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function setStoredUser(user) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

export function getStoredUserRaw() {
  return localStorage.getItem(USER_KEY);
}

export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** 仅解码 payload，不校验签名（用于读取 exp） */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1];
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function clearScheduledTokenExpiry() {
  if (expiryTimerId !== null) {
    clearTimeout(expiryTimerId);
    expiryTimerId = null;
  }
}

/**
 * 在 access token 过期前触发回调（略提前，减少边界请求失败）
 * @param {() => void} onExpired
 */
export function scheduleTokenExpiry(onExpired) {
  clearScheduledTokenExpiry();
  const payload = decodeJwtPayload(getToken());
  const expSec = payload?.exp;
  if (typeof expSec !== 'number') return;

  const ms = expSec * 1000 - Date.now() - 5000;
  if (ms <= 0) {
    onExpired();
    return;
  }
  expiryTimerId = setTimeout(onExpired, ms);
}
