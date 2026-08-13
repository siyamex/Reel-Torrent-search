import { apiClient } from './apiClient';
import type { SeedrAuthStatus } from '@/types/seedr';

export const authService = {
  /**
   * Signs the current user's Seedr account in with their own Seedr
   * email/password. Seedr has no OAuth app-registration process for third
   * parties, so this is the real, working connection method — the backend
   * only ever stores the resulting tokens, never the password.
   */
  async connectSeedr(email: string, password: string): Promise<void> {
    await apiClient.post('/auth/seedr/connect', { email, password });
  },

  async getStatus(): Promise<SeedrAuthStatus> {
    const { data } = await apiClient.get<SeedrAuthStatus>('/auth/seedr/status');
    return data;
  },

  async disconnectSeedr(): Promise<void> {
    await apiClient.post('/auth/seedr/logout');
  },
};
