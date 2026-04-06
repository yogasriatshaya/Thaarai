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

// Robust image URL helper for admin
export const getFullUrl = (path) => {
  if (!path) return '';
  const sPath = String(path);
  
  // 1. Get backend URL from environment, handling literal 'undefined' string
  let envUrl = import.meta.env.VITE_BACKEND_URL;
  if (!envUrl || envUrl === 'undefined') {
    envUrl = 'http://localhost:5001';
  }
  const backendUrl = envUrl.replace(/\/+$/, '');
  
  // 2. Normalize slashes first
  const normalized = sPath.replace(/\\/g, '/');
  
  // 3. If it contains "uploads/", extract it to ensure it uses CURRENT backendUrl
  const uIdx = normalized.indexOf('uploads/');
  if (uIdx !== -1) {
    const finalPath = normalized.substring(uIdx);
    return `${backendUrl}/${finalPath}`;
  }

  // 4. If it's already an absolute URL but doesn't have "uploads/", return as is
  if (normalized.startsWith('http') || normalized.startsWith('data:')) return normalized;

  // 5. Otherwise, treat as a relative path. 
  // If it doesn't have "uploads/" by now, it's likely a legacy path or missing the prefix.
  const cleanPath = normalized.startsWith('/') ? normalized.substring(1) : normalized;
  if (!cleanPath.startsWith('uploads/')) {
    return `${backendUrl}/uploads/${cleanPath}`;
  }
  return `${backendUrl}/${cleanPath}`;
};