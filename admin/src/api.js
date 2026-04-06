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
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/';

/**
 * Safely resolves an image URL from the backend or an absolute URL.
 * Handles redundant slashes and returns a fallback if path is missing.
 */
export const getImgUrl = (path) => {
  if (!path) return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=500&fit=crop';
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;

  const baseUrl = BACKEND_URL.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');

  return `${baseUrl}/${cleanPath}`;
};