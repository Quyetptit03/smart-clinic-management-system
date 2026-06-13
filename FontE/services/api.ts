import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { authService } from './authService';

const isAuthRequest = (url: string) =>
  url.includes('/auth/login') ||
  url.includes('/auth/register') ||
  url.includes('/auth/refresh');

const resolveApiBaseUrl = (): string => {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (!configured) return '/api';

  const trimmed = configured.replace(/\/$/, '');
  if (trimmed.startsWith('http') && !trimmed.endsWith('/api')) {
    return `${trimmed}/api`;
  }
  return trimmed;
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Track in-flight refresh requests so concurrent 401s share one refresh call.
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Request interceptor: attach access token, skip auth endpoints.
api.interceptors.request.use(
  (config) => {
    const requestUrl = typeof config.url === 'string' ? config.url : '';

    if (!isAuthRequest(requestUrl)) {
      const token = authService.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 with automatic token refresh + rotation.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const requestUrl = originalRequest?.url ?? '';

    // Guard: skip refresh for auth endpoints, already retried, or network error.
    if (
      !originalRequest ||
      isAuthRequest(requestUrl) ||
      originalRequest._retry ||
      !error.response
    ) {
      // If 401 on a non-auth endpoint and we have no refresh token, redirect to login.
      if (error.response?.status === 401 && !authService.getRefreshToken()) {
        authService.clearTokens();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Only attempt refresh on 401.
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (!isRefreshing) {
      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const newTokens = await authService.refresh();
        onRefreshed(newTokens.accessToken);

        // Retry the original request with the new token.
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newTokens.accessToken}`,
        };
        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        authService.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Queue this request until refresh completes.
    return new Promise<string>((resolve) => {
      subscribeTokenRefresh((newToken: string) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        resolve(newToken);
      });
    })
      .then(() => api(originalRequest))
      .catch((err) => Promise.reject(err));
  }
);

export default api;
