import { apiClient } from './apiClient';
import type { MovieDetails, MovieSummary, PaginatedResult, TrendingWindow } from '@/types/movie';

export const movieService = {
  async getTrending(window: TrendingWindow): Promise<MovieSummary[]> {
    const { data } = await apiClient.get<{ results: MovieSummary[] }>(`/movies/trending/${window}`);
    return data.results;
  },

  async search(query: string, page: number): Promise<PaginatedResult<MovieSummary>> {
    const { data } = await apiClient.get<PaginatedResult<MovieSummary>>('/movies/search', {
      params: { query, page },
    });
    return data;
  },

  async getDetails(id: number | string): Promise<MovieDetails> {
    const { data } = await apiClient.get<MovieDetails>(`/movies/${id}`);
    return data;
  },
};
