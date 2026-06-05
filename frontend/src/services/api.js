import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
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
  verifyMfa: (userId, code) => api.post('/api/auth/verify-mfa', { userId, code }),
  toggleMfa: (enabled) => api.post('/api/auth/toggle-mfa', { enabled }),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
};

export const applicantsAuthAPI = {
  register: (data) => api.post('/api/applicants/auth/register', data),
  login: (data) => api.post('/api/applicants/auth/login', data),
  verifyEmail: (token) => api.post('/api/applicants/auth/verify-email', { token }),
  verifyMfa: (userId, code) => api.post('/api/applicants/auth/verify-mfa', { userId, code }),
  toggleMfa: (enabled) => api.post('/api/applicants/auth/toggle-mfa', { enabled }),
  logout: () => api.post('/api/applicants/auth/logout'),
  me: () => api.get('/api/applicants/auth/profile'),
  updateProfile: (data) => api.put('/api/applicants/auth/profile', data),
};

export const jobsAPI = {
  list: (params) => {
    const userType = localStorage.getItem('userType');
    if (userType === 'applicant') {
      return api.get('/api/recruitment/jobs', { params }).then((res) => ({
        ...res,
        data: res.data.jobs || [],
      }));
    }
    return api.get('/api/jobs', { params });
  },
  get: (id) => {
    const userType = localStorage.getItem('userType');
    if (userType === 'applicant') {
      return api.get(`/api/recruitment/jobs/${id}`).then((res) => ({
        ...res,
        data: res.data.job || null,
      }));
    }
    return api.get(`/api/jobs/${id}`);
  },
  create: (data) => api.post('/api/jobs', data),
  update: (id, data) => api.put(`/api/jobs/${id}`, data),
  delete: (id) => api.delete(`/api/jobs/${id}`),
  generateQuestions: (id) => api.post(`/api/jobs/${id}/questions`),
  toggleSave: (id) => api.post(`/api/recruitment/save-job/${id}`),
};

// Helper to upload a file directly to Cloudinary or fall back to backend
async function uploadToCloudinaryOrBackend(file, endpoint, fileFieldName, extraFields = {}, resourceType = 'raw') {
  try {
    const presignRes = await api.get('/api/media/presign', {
      params: { 
        folder: resourceType === 'video' ? 'videos' : 'resumes', 
        resourceType 
      }
    });

    if (presignRes.data.configured) {
      const { signature, timestamp, cloudName, apiKey, folder } = presignRes.data;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
      
      const uploadRes = await axios.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const secureUrl = uploadRes.data.secure_url;

      const payload = {
        ...extraFields,
      };
      if (fileFieldName === 'resume') {
        payload.resumeUrl = secureUrl;
      } else if (fileFieldName === 'video') {
        payload.videoUrl = secureUrl;
      }

      return api.post(endpoint, payload);
    }
  } catch (err) {
    console.warn('Presign or direct cloud upload failed, falling back to local backend upload:', err);
  }

  const formData = new FormData();
  formData.append(fileFieldName, file);
  Object.entries(extraFields).forEach(([k, v]) => formData.append(k, v));

  return api.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export const applicationsAPI = {
  list: (params) => {
    const userType = localStorage.getItem('userType');
    if (userType === 'applicant') {
      return api.get('/api/recruitment/my-applications', { params });
    }
    if (params?.job) {
      return api.get(`/api/recruitment/applicants/${params.job}`).then((res) => ({
        ...res,
        data: res.data.applications || [],
      }));
    }
    return api.get('/api/applications', { params });
  },
  get: (id) => api.get(`/api/applications/${id}`),
  uploadResume: (jobId, file) => {
    const userType = localStorage.getItem('userType');
    const url = userType === 'applicant'
      ? `/api/recruitment/apply/${jobId}`
      : `/api/applications/${jobId}/upload`;
    return uploadToCloudinaryOrBackend(file, url, 'resume', {}, 'raw');
  },
  uploadVideo: (appId, file, extraFields = {}) => {
    const userType = localStorage.getItem('userType');
    const url = userType === 'applicant'
      ? `/api/interviews/upload/${appId}`
      : `/api/applications/${appId}/video`;
    return uploadToCloudinaryOrBackend(file, url, 'video', extraFields, 'video');
  },
  updateStatus: (id, status) => api.put(`/api/recruitment/applications/${id}/status`, { status }),
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

export const adminUsersAPI = {
  list: (params) => api.get('/api/admin/users', { params }),
  create: (data) => api.post('/api/admin/users', data),
  get: (id) => api.get(`/api/admin/users/${id}`),
  update: (id, data) => api.put(`/api/admin/users/${id}`, data),
  delete: (id) => api.delete(`/api/admin/users/${id}`),
  resetPassword: (id, newPassword) => api.put(`/api/admin/users/${id}/reset-password`, { newPassword }),
  activate: (id) => api.put(`/api/admin/users/${id}/activate`),
  deactivate: (id) => api.put(`/api/admin/users/${id}/deactivate`),
};

export const recruitmentAPI = {
  convertToEmployee: (appId, data) => api.post(`/api/recruitment/applications/${appId}/convert-to-employee`, { applicationId: appId, ...data }),
};

export function mediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = API_URL || window.location.origin;
  return `${base}${path}`;
}

export default api;
