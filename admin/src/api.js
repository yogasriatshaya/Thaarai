import axios from 'axios';
const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api' });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';