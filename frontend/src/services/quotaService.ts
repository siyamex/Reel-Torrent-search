import { apiClient } from './apiClient';
import type { SeedrQuota } from '@/types/seedr';

export const quotaService = {
  async getQuota(): Promise<SeedrQuota> {
    const { data } = await apiClient.get<SeedrQuota>('/seedr/quota');
    return data;
  },
};
