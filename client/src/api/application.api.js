import { api } from './axios.js';

export const applicationApi = {
  send: (payload) => api.post('/applications', payload).then((r) => r.data),
  list: (params) => api.get('/applications', { params }).then((r) => r.data),
  updateStatus: (id, status) => api.put(`/applications/${id}/status`, { status }).then((r) => r.data),
  stats: () => api.get('/applications/stats').then((r) => r.data),
};
