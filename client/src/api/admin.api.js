import { api } from './axios.js';

export const adminApi = {
  listUsers: (params) => api.get('/admin/users', { params }).then((r) => r.data),
  setUserStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }).then((r) => r.data),
  setUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data),
  listStartups: (params) => api.get('/admin/startups', { params }).then((r) => r.data),
  removeStartup: (id) => api.delete(`/admin/startups/${id}`).then((r) => r.data),
  listSkills: () => api.get('/admin/skills').then((r) => r.data),
  addSkill: (payload) => api.post('/admin/skills', payload).then((r) => r.data),
  removeSkill: (id) => api.delete(`/admin/skills/${id}`).then((r) => r.data),
};
