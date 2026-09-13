import { api } from './axios.js';

export const discoverApi = {
  builders: (params) => api.get('/discover/builders', { params }).then((r) => r.data),
  startups: (params) => api.get('/discover/startups', { params }).then((r) => r.data),
};
