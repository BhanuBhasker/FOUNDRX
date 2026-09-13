import { api } from './axios.js';

export const startupApi = {
  create: (payload) => api.post('/startups', payload).then((r) => r.data),
  list: (params) => api.get('/startups', { params }).then((r) => r.data),
  mine: () => api.get('/startups/mine').then((r) => r.data),
  detail: (id) => api.get(`/startups/${id}`).then((r) => r.data),
  update: (id, payload) => api.put(`/startups/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/startups/${id}`).then((r) => r.data),

  members: (id) => api.get(`/startups/${id}/members`).then((r) => r.data),
  addMember: (id, payload) => api.post(`/startups/${id}/members`, payload).then((r) => r.data),
  updateMemberRole: (id, userId, teamRole) => api.put(`/startups/${id}/members/${userId}`, { teamRole }).then((r) => r.data),
  removeMember: (id, userId) => api.delete(`/startups/${id}/members/${userId}`).then((r) => r.data),

  listProjects: (startupId) => api.get(`/startups/${startupId}/projects`).then((r) => r.data),
};

export const projectApi = {
  create: (payload) => api.post('/projects', payload).then((r) => r.data),
  detail: (id) => api.get(`/projects/${id}`).then((r) => r.data),
  update: (id, payload) => api.put(`/projects/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/projects/${id}`).then((r) => r.data),
  addMember: (id, payload) => api.post(`/projects/${id}/members`, payload).then((r) => r.data),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`).then((r) => r.data),
};

export const milestoneApi = {
  create: (payload) => api.post('/milestones', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/milestones/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/milestones/${id}`).then((r) => r.data),
};
