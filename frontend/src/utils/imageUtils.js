import { PRODUCT_FALLBACK } from '../assets/images';

/**
 * Safely resolves an image URL from the backend or an absolute URL.
 * It handles missing slashes, removes redundant leading/trailing slashes, 
 * and returns a fallback image if no path is provided.
 * 
 * @param {string} path - The image path or URL
 * @param {string} backendUrl - The VITE_BACKEND_URL from ShopContext
 * @returns {string} The full image URL
 */
export const getFullImgUrl = (path, backendUrl) => {
  if (!path) return PRODUCT_FALLBACK;
  if (path.startsWith('http')) return path;

  const baseUrl = (backendUrl || '').replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');

  return `${baseUrl}/${cleanPath}`;
};
