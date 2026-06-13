import api from './api';

export interface AuthResponse {
  token: string;
  refreshToken: string;
  username: string;
  role: string;
  expiresAt: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
  role: string;
  expiresAt: string;
}

const ACCESS_TOKEN_KEY = 'emr_access_token';
const REFRESH_TOKEN_KEY = 'emr_refresh_token';

export const authService = {
  setTokens: (response: AuthResponse | RefreshResponse) => {
    const accessToken = 'token' in response ? response.token : response.accessToken;
    const refreshToken = response.refreshToken;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),

  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),

  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { username, password });
    if (!response.data?.token) {
      throw new Error('Authentication failed: no token received from server.');
    }
    authService.setTokens(response.data);
    return response.data;
  },

  register: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', { username, password });
    if (!response.data?.token) {
      throw new Error('Registration failed: no token received from server.');
    }
    authService.setTokens(response.data);
    return response.data;
  },

  refresh: async (): Promise<RefreshResponse> => {
    const refreshToken = authService.getRefreshToken();
    const accessToken = authService.getAccessToken();
    if (!refreshToken || !accessToken) {
      throw new Error('No refresh token available.');
    }

    const response = await api.post<RefreshResponse>('/auth/refresh', {
      accessToken,
      refreshToken,
    });

    if (!response.data?.accessToken) {
      throw new Error('Token refresh failed: no access token received.');
    }

    // Rotate: store the new pair returned by the server.
    authService.setTokens(response.data);
    return response.data;
  },

  revoke: async (): Promise<void> => {
    const refreshToken = authService.getRefreshToken();
    if (!refreshToken) return;

    try {
      await api.post('/auth/revoke', { refreshToken });
    } catch {
      // Swallow errors — revoke is best-effort on logout.
    } finally {
      authService.clearTokens();
    }
  },

  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  logout: () => {
    authService.revoke();
  },

  isAuthenticated: () => !!authService.getAccessToken(),
};
