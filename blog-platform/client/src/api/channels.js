import http from './http';

export function fetchChannels() {
  return http.get('/api/channels');
}
