import api from './api';

export interface User {
  id: string;
  username: string;
  role: string;
  isLocked: boolean;
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  role: string;
}

export interface UpdateUserPayload {
  id: string;
  password: string;
}

export interface ChangeRolePayload {
  userId: string;
  newRole: string;
}

export const userService = {
  getAll: async (): Promise<User[]> => {
    const res = await api.get<User[]>('/Users');
    return res.data;
  },

  getById: async (id: string): Promise<User> => {
    const res = await api.get<User>(`/Users/${id}`);
    return res.data;
  },

  create: async (payload: CreateUserPayload): Promise<User> => {
    const res = await api.post<User>('/Users', payload);
    return res.data;
  },

  update: async (payload: UpdateUserPayload): Promise<User> => {
    const res = await api.put<User>('/Users', payload);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/Users/${id}`);
  },

  lock: async (id: string): Promise<void> => {
    await api.post(`/Users/lock/${id}`);
  },

  unlock: async (id: string): Promise<void> => {
    await api.post(`/Users/unlock/${id}`);
  },

  changeRole: async (payload: ChangeRolePayload): Promise<User> => {
    const res = await api.post<User>('/Users/change-role', payload);
    return res.data;
  },
};
