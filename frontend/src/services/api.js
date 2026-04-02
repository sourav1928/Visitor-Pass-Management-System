import axios from 'axios';

const api = axios.create({
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Response interceptor — auto logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('vp_token');
      localStorage.removeItem('vp_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Auth ────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// ─── Visitors ────────────────────────────────────────
export const visitorAPI = {
  getAll: (params) => api.get('/visitors', { params }),
  getById: (id) => api.get(`/visitors/${id}`),
  create: (data) => api.post('/visitors', data),
  update: (id, data) => api.put(`/visitors/${id}`, data),
  delete: (id) => api.delete(`/visitors/${id}`),
};

// ─── Appointments ────────────────────────────────────
export const appointmentAPI = {
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  approve: (id) => api.patch(`/appointments/${id}/approve`),
  reject: (id) => api.patch(`/appointments/${id}/reject`),
  cancel: (id) => api.patch(`/appointments/${id}/cancel`),
  myAppointments: () => api.get('/appointments/mine'),
};

// ─── Passes ──────────────────────────────────────────
export const passAPI = {
  getAll: (params) => api.get('/passes', { params }),
  getById: (id) => api.get(`/passes/${id}`),
  issue: (data) => api.post('/passes/issue', data),
  getByQR: (qrCode) => api.get(`/passes/qr/${qrCode}`),
  downloadPDF: (id) => api.get(`/passes/${id}/pdf`, { responseType: 'blob' }),
};

// ─── Check Logs ──────────────────────────────────────
export const checkLogAPI = {
  getAll: (params) => api.get('/checklogs', { params }),
  checkin: (data) => api.post('/checklogs/checkin', data),
  checkout: (data) => api.post('/checklogs/checkout', data),
};

// ─── Users (Admin) ───────────────────────────────────
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// ─── Dashboard ───────────────────────────────────────
export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
  recentVisitors: () => api.get('/dashboard/recent-visitors'),
  checkLogs: () => api.get('/dashboard/check-logs'),
};
