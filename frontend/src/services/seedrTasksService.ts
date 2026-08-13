import { apiClient } from './apiClient';
import type { SeedrTask } from '@/types/seedr';

export const seedrTasksService = {
  async list(): Promise<SeedrTask[]> {
    const { data } = await apiClient.get<{ tasks: SeedrTask[] }>('/seedr/tasks');
    return data.tasks;
  },

  async create(torrentUrl: string): Promise<void> {
    await apiClient.post('/seedr/tasks', { url: torrentUrl });
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/seedr/tasks/${id}`);
  },

  async getFolderContents(id: string): Promise<unknown> {
    const { data } = await apiClient.get<{ contents: unknown }>(`/seedr/folders/${id}/contents`);
    return data.contents;
  },
};
