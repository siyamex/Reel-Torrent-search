import axios from 'axios';
import { env } from '../config/env';
import { getCache } from '../cache';
import { logger } from '../utils/logger';
import type { TmdbMovieDetails, TmdbMovieSummary, TmdbPaginatedResponse } from '../types/tmdb';

const TRENDING_TTL_SECONDS = env.CACHE_TTL_SECONDS; // 6h default
const DETAILS_TTL_SECONDS = env.CACHE_TTL_SECONDS; // 6h default
const SEARCH_TTL_SECONDS = 60 * 15; // search results change/rank often, cache briefly

const tmdbClient = axios.create({
  baseURL: env.TMDB_BASE_URL,
  timeout: 8000,
  params: {
    api_key: env.TMDB_API_KEY,
  },
});

tmdbClient.interceptors.request.use((config) => {
  logger.debug({ url: config.url, params: config.params }, 'TMDB request');
  return config;
});

export type TrendingWindow = 'day' | 'week';

async function getTrending(window: TrendingWindow): Promise<TmdbMovieSummary[]> {
  const cache = getCache();
  return cache.getOrSet(`tmdb:trending:${window}`, TRENDING_TTL_SECONDS, async () => {
    const { data } = await tmdbClient.get<TmdbPaginatedResponse<TmdbMovieSummary>>(
      `/trending/movie/${window}`,
    );
    return data.results;
  });
}

async function searchMovies(
  query: string,
  page: number,
): Promise<TmdbPaginatedResponse<TmdbMovieSummary>> {
  const cache = getCache();
  const key = `tmdb:search:${query.toLowerCase().trim()}:${page}`;
  return cache.getOrSet(key, SEARCH_TTL_SECONDS, async () => {
    const { data } = await tmdbClient.get<TmdbPaginatedResponse<TmdbMovieSummary>>(
      '/search/movie',
      {
        params: { query, page, include_adult: false },
      },
    );
    return data;
  });
}

async function getMovieDetails(id: number): Promise<TmdbMovieDetails> {
  const cache = getCache();
  const key = `tmdb:movie:${id}`;
  return cache.getOrSet(key, DETAILS_TTL_SECONDS, async () => {
    const { data } = await tmdbClient.get<TmdbMovieDetails>(`/movie/${id}`, {
      params: { append_to_response: 'credits' },
    });
    return data;
  });
}

export const tmdbService = {
  getTrending,
  searchMovies,
  getMovieDetails,
};
