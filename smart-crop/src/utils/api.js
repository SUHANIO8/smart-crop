import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach token ONLY if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle unauthorized safely (do NOT break predict API)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized request');

      // Clear auth data
      localStorage.removeItem('sc_token');
      localStorage.removeItem('sc_user');

      // Redirect ONLY if auth-related endpoint
      const authEndpoints = ['/auth/login', '/auth/register'];
      const reqUrl = error.config?.url || '';

      if (authEndpoints.some(ep => reqUrl.includes(ep))) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

