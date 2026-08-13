import { apiClient } from './apiClient';
import type { PublicUser } from '@/types/user';

export const userAuthService = {
  async register(username: string, password: string): Promise<PublicUser> {
    const { data } = await apiClient.post<{ user: PublicUser }>('/auth/register', {
      username,
      password,
    });
    return data.user;
  },

  async login(username: string, password: string): Promise<PublicUser> {
    const { data } = await apiClient.post<{ user: PublicUser }>('/auth/login', {
      username,
      password,
    });
    return data.user;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async me(): Promise<PublicUser | null> {
    const { data } = await apiClient.get<{ user: PublicUser | null }>('/auth/me');
    return data.user;
  },
};
