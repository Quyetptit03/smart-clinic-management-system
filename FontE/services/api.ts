import axios from 'axios';

const isAuthRequest = (url: string) =>
  url.includes('/auth/login') || url.includes('/auth/register');

const resolveApiBaseUrl = (): string => {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (!configured) return '/api';

  const trimmed = configured.replace(/\/$/, '');
  if (trimmed.startsWith('http') && !trimmed.endsWith('/api')) {
    return `${trimmed}/api`;
  }
  return trimmed;
};

// Use the Next.js /api proxy in dev; override with NEXT_PUBLIC_API_URL in production.
const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const requestUrl = typeof config.url === 'string' ? config.url : '';

    if (typeof window !== 'undefined' && !isAuthRequest(requestUrl)) {
      const token = localStorage.getItem('emr_auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration/errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config ?? {};
    const requestUrl = typeof originalRequest.url === 'string' ? originalRequest.url : '';

    if (error.response?.status === 401 && !isAuthRequest(requestUrl)) {
      localStorage.removeItem('emr_auth_token')
      window.location.href = "/login"
    }

    return Promise.reject(error)
  }
)

export default api;
