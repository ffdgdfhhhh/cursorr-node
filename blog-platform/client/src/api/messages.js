import http from './http';

export function fetchConversations() {
  return http.get('/api/messages/conversations');
}

export function openConversation(payload) {
  return http.post('/api/messages/conversations', payload);
}

export function fetchConversationMessages(id, params) {
  return http.get(`/api/messages/conversations/${id}`, { params });
}

export function markConversationRead(id) {
  return http.put(`/api/messages/conversations/${id}/read`);
}
