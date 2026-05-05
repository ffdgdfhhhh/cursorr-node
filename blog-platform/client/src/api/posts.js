import http from './http';

export function fetchPosts(params) {
  return http.get('/api/posts', { params });
}

export function fetchPost(id) {
  return http.get(`/api/posts/${id}`);
}

export function deletePost(id) {
  return http.delete(`/api/posts/${id}`);
}

export function toggleLike(id) {
  return http.post(`/api/posts/${id}/like`);
}

export function fetchComments(postId) {
  return http.get(`/api/posts/${postId}/comments`);
}

export function addComment(postId, payload) {
  return http.post(`/api/posts/${postId}/comments`, payload);
}

export function reportPost(postId, payload) {
  return http.post(`/api/posts/${postId}/report`, payload);
}

export function createPost(formData) {
  return http.post('/api/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
