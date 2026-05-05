import http from './http';

export function fetchUser(id) {
  return http.get(`/api/users/${id}`);
}

export function fetchUserPosts(id, params) {
  return http.get(`/api/users/${id}/posts`, { params });
}

export function updateProfile(payload) {
  return http.put('/api/users/profile', payload);
}

export function updateAvatar(formData) {
  // 勿手写 multipart Content-Type，否则缺少 boundary 会导致服务端无法解析文件
  return http.put('/api/users/avatar', formData);
}

export function fetchMyLikedPosts(params) {
  return http.get('/api/users/me/liked-posts', { params });
}

export function fetchMyReports() {
  return http.get('/api/users/me/reports');
}

export function changePassword(payload) {
  return http.put('/api/users/profile/password', payload);
}

export function followUser(userId) {
  return http.post(`/api/users/${userId}/follow`);
}

export function unfollowUser(userId) {
  return http.delete(`/api/users/${userId}/follow`);
}

export function fetchMyFollowing(params) {
  return http.get('/api/users/me/following', { params });
}
