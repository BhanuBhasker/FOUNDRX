import { api } from './axios.js';

export const skillApi = {
  listSkills: () => api.get('/skills').then((r) => r.data),
  listInterests: () => api.get('/skills/interests').then((r) => r.data),
};
