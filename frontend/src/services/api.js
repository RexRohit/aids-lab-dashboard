import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const fetchSummary = async () => {
  const response = await api.get('/summary');
  return response.data;
};

export const fetchLabs = async () => {
  const response = await api.get('/labs');
  return response.data;
};

export const fetchLabById = async (id) => {
  const response = await api.get(`/labs/${id}`);
  return response.data;
};

export const fetchEquipment = async (params = {}) => {
  const response = await api.get('/equipment', { params });
  return response.data;
};

export const triggerRefresh = async () => {
  const response = await api.post('/refresh');
  return response.data;
};

export default api;
