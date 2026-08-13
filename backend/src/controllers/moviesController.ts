import type { Request, Response } from 'express';
import { z } from 'zod';
import { tmdbService } from '../services/tmdbService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const trendingWindowSchema = z.enum(['day', 'week']);

const searchQuerySchema = z.object({
  query: z.string().trim().min(1, 'query is required'),
  page: z.coerce.number().int().min(1).max(500).default(1),
});

const movieIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const getTrending = asyncHandler(async (req: Request, res: Response) => {
  const parsed = trendingWindowSchema.safeParse(req.params.window);
  if (!parsed.success) {
    throw ApiError.badRequest('window must be "day" or "week"');
  }

  const results = await tmdbService.getTrending(parsed.data);
  res.json({ results });
});

export const searchMovies = asyncHandler(async (req: Request, res: Response) => {
  const parsed = searchQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw ApiError.badRequest('Invalid search parameters', parsed.error.flatten());
  }

  const { query, page } = parsed.data;
  const data = await tmdbService.searchMovies(query, page);
  res.json(data);
});

export const getMovieDetails = asyncHandler(async (req: Request, res: Response) => {
  const parsed = movieIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    throw ApiError.badRequest('Invalid movie id');
  }

  const movie = await tmdbService.getMovieDetails(parsed.data.id);
  res.json(movie);
});
