"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import toast from 'react-hot-toast';

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
  } catch {
    return '';
  }
}

function decodeTokenPayload(token: string | null): { role?: string; username?: string } {
  if (!token) return {};
  const segments = token.split('.');
  if (segments.length !== 3) return {};
  try {
    const payload = JSON.parse(base64UrlDecode(segments[1])) as Record<string, unknown>;
    return {
      role: (payload['role'] as string) ?? (payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string),
      username: (payload['unique_name'] as string) ?? (payload['sub'] as string),
    };
  } catch {
    return {};
  }
}

export function useAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const accessToken = typeof window !== 'undefined' ? authService.getAccessToken() : null;
  const decodedToken = useMemo(() => decodeTokenPayload(accessToken), [accessToken]);
  const role = decodedToken.role ?? '';
  const username = decodedToken.username ?? '';

  const hasRole = useCallback(
    (requiredRole: string): boolean => {
      if (!role) return false;
      const allowed = requiredRole.split(',').map((r) => r.trim());
      return allowed.includes(role);
    },
    [role]
  );

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = authService.isAuthenticated();
      setIsAuthenticated(authStatus);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (username: string, password: string, remember: boolean = false) => {
    try {
      const response = await authService.login(username, password);
      setIsAuthenticated(true);
      toast.success('Login successful!');

      if (remember) {
        localStorage.setItem('emr_remember_me', 'true');
      } else {
        localStorage.removeItem('emr_remember_me');
      }

      router.push('/dashboard');
      return { success: true };
    } catch (error: any) {
      const data = error?.response?.data;
      const msg =
        (typeof data === 'string' ? data : data?.message || data?.title) ||
        error?.message ||
        'Invalid username or password';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    authService.logout(); // clears tokens + calls revoke endpoint
    setIsAuthenticated(false);
    localStorage.removeItem('emr_remember_me');
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    role,
    username,
    hasRole,
  };
}
