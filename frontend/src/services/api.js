import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://aids-lab-dashboard.onrender.com'
);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send HttpOnly session cookies with all cross-site requests
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Authorization header if token is stored (resilience for cross-origin third party cookie blocks)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && error.config.url.includes('/api/admin/')) {
      if (!error.config.url.includes('/login')) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
    }
    return Promise.reject(error);
  }
);

// Public API
export const fetchSummary = async () => {
  const response = await api.get('/api/summary');
  return response.data;
};

export const fetchLabs = async () => {
  const response = await api.get('/api/labs');
  return response.data;
};

export const fetchLabById = async (id) => {
  const response = await api.get(`/api/labs/${id}`);
  return response.data;
};

export const fetchEquipment = async (params = {}) => {
  const response = await api.get('/api/equipment', { params });
  return response.data;
};

export const triggerRefresh = async () => {
  const response = await api.post('/api/refresh');
  return response.data;
};

// Admin API
export const adminLogin = async (credentials) => {
  const response = await api.post('/api/admin/login', credentials);
  if (response.data.success && response.data.token) {
    localStorage.setItem('admin_token', response.data.token);
    localStorage.setItem('admin_user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const adminLogout = async () => {
  try {
    const response = await api.post('/api/admin/logout');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    return response.data;
  } catch (err) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    return { success: true };
  }
};

export const checkAdminAuth = async () => {
  const response = await api.get('/api/admin/me');
  return response.data;
};

export const fetchAdminRecords = async (labId = 'all') => {
  const response = await api.get('/api/admin/records', { params: { labId } });
  return response.data;
};

export const updateAdminRecord = async (id, updatedFields) => {
  const response = await api.put(`/api/admin/records/${id}`, updatedFields);
  return response.data;
};

export const addAdminRecord = async (labId, record) => {
  const response = await api.post('/api/admin/records', { labId, record });
  return response.data;
};

export const deleteAdminRecord = async (id) => {
  const response = await api.delete(`/api/admin/records/${id}`);
  return response.data;
};

export const updateAdminLabInfo = async (labId, labInfo) => {
  const response = await api.put(`/api/admin/labs/${labId}/info`, labInfo);
  return response.data;
};

export const batchSaveAdminLab = async (labId, records, labInfo) => {
  const response = await api.post('/api/admin/save', { labId, records, labInfo });
  return response.data;
};



export const getAdminStatus = async () => {
  const response = await api.get('/api/admin/status');
  return response.data;
};

export const syncGoogleSheets = async () => {
  const response = await api.post('/api/admin/sync-sheets');
  return response.data;
};

export { API_URL };
export default api;
