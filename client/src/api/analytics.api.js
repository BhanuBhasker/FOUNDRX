import { api } from './axios.js';

export const dashboardApi = {
  summary: () => api.get('/dashboard').then((r) => r.data),
  analytics: () => api.get('/dashboard/analytics').then((r) => r.data),
};

export const adminAnalyticsApi = {
  platform: () => api.get('/admin/analytics').then((r) => r.data),
};
