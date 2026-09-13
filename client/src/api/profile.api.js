import { api } from './axios.js';

export const profileApi = {
  getMine: () => api.get('/profiles/me').then((r) => r.data),
  getByUserId: (userId) => api.get(`/profiles/${userId}`).then((r) => r.data),
  update: (payload) => api.put('/profiles/me', payload).then((r) => r.data),
  save: (userId) => api.post(`/profiles/saved/${userId}`).then((r) => r.data),
  unsave: (userId) => api.delete(`/profiles/saved/${userId}`).then((r) => r.data),
  saved: () => api.get('/profiles/saved').then((r) => r.data),
};
