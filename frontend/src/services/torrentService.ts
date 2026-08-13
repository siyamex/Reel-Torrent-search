import { apiClient } from './apiClient';
import type { TorrentSearchResponse } from '@/types/torrent';

export const torrentService = {
  async search(title: string, year?: number): Promise<TorrentSearchResponse> {
    const { data } = await apiClient.get<TorrentSearchResponse>('/torrents/search', {
      params: { title, year },
    });
    return data;
  },
};
