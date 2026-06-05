import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
};

export const jobsAPI = {
  list: (params) => api.get('/api/jobs', { params }),
  get: (id) => api.get(`/api/jobs/${id}`),
  create: (data) => api.post('/api/jobs', data),
  update: (id, data) => api.put(`/api/jobs/${id}`, data),
  delete: (id) => api.delete(`/api/jobs/${id}`),
  generateQuestions: (id) => api.post(`/api/jobs/${id}/questions`),
};

export const applicationsAPI = {
  list: (params) => api.get('/api/applications', { params }),
  get: (id) => api.get(`/api/applications/${id}`),
  uploadResume: (jobId, file) => {
    const form = new FormData();
    form.append('resume', file);
    return api.post(`/api/applications/${jobId}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadVideo: (appId, file) => {
    const form = new FormData();
    form.append('video', file);
    return api.post(`/api/applications/${appId}/video`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateStatus: (id, status) => api.put(`/api/applications/${id}/status`, { status }),
  bulkScore: (jobId) => api.post('/api/applications/bulk-score', { jobId }),
};

export const usersAPI = {
  updateProfile: (data) => api.put('/api/users/profile', data),
  list: () => api.get('/api/users'),
  delete: (id) => api.delete(`/api/users/${id}`),
};

export const statsAPI = {
  get: () => api.get('/api/statistics'),
};

export const hrAPI = {
  companyDashboard: () => api.get('/api/hr/dashboard/company'),
  employees: (params) => api.get('/api/hr/employees', { params }),
  attendance: (params) => api.get('/api/hr/attendance', { params }),
  attendanceInsights: (params) => api.get('/api/hr/attendance/insights', { params }),
  checkIn: (body) => api.post('/api/hr/attendance/check-in', body),
  checkOut: () => api.post('/api/hr/attendance/check-out'),
  payroll: (params) => api.get('/api/hr/payroll', { params }),
  runPayroll: (month) => api.post('/api/hr/payroll/run', { month }),
  performance: (params) => api.get('/api/hr/performance', { params }),
  createPerformance: (data) => api.post('/api/hr/performance', data),  leaves: () => api.get('/api/hr/leaves'),
  applyLeave: (data) => api.post('/api/hr/leaves', data),
  pendingLeaves: () => api.get('/api/hr/leaves/pending'),
  approveLeave: (id) => api.put(`/api/hr/leaves/${id}/approve`),
  rejectLeave: (id) => api.put(`/api/hr/leaves/${id}/reject`),};

export const aiAPI = {
  chat: (message) => api.post('/api/ai/chat', { message }),
  jobRecommendations: () => api.get('/api/ai/job-recommendations'),
};

export function mediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = API_URL || window.location.origin;
  return `${base}${path}`;
}

export default api;
