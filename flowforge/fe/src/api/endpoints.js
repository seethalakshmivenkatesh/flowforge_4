import api from './axios';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
};

export const projectApi = {
  list: (params) => api.get('/projects', { params }),
  create: (data) => api.post('/projects', data),
  get: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.put(`/projects/${id}`, data),
  remove: (id) => api.delete(`/projects/${id}`),
  archive: (id) => api.put(`/projects/${id}/archive`),
  addMember: (id, userId) => api.post(`/projects/${id}/members`, { userId }),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
  activity: (id) => api.get(`/projects/${id}/activity`),
};

export const taskApi = {
  list: (params) => api.get('/tasks', { params }),
  create: (data) => api.post('/tasks', data),
  get: (id) => api.get(`/tasks/${id}`),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  remove: (id) => api.delete(`/tasks/${id}`),
  addComment: (id, text) => api.post(`/tasks/${id}/comments`, { text }),
  updateChecklist: (id, checklist) => api.put(`/tasks/${id}/checklist`, { checklist }),
};

export const workflowApi = {
  list: (params) => api.get('/workflows', { params }),
  create: (data) => api.post('/workflows', data),
  get: (id) => api.get(`/workflows/${id}`),
  update: (id, data) => api.put(`/workflows/${id}`, data),
  remove: (id) => api.delete(`/workflows/${id}`),
  toggle: (id) => api.post(`/workflows/${id}/toggle`),
  test: (id, taskId) => api.post(`/workflows/${id}/test`, { taskId }),
  executions: (id, params) => api.get(`/workflows/${id}/executions`, { params }),
};

export const notificationApi = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
  charts: () => api.get('/dashboard/charts'),
  analytics: () => api.get('/dashboard/analytics'),
};

export const userApi = {
  list: (params) => api.get('/users', { params }),
};

export const searchApi = {
  global: (q) => api.get('/search', { params: { q } }),
};
