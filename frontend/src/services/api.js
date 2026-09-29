import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

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

export { API_URL };
export default api;
