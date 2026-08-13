import type { Request, Response } from 'express';
import { z } from 'zod';
import { prowlarrService } from '../services/prowlarrService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const searchQuerySchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  year: z.coerce.number().int().min(1878).max(2100).optional(),
});

export const searchTorrents = asyncHandler(async (req: Request, res: Response) => {
  const parsed = searchQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw ApiError.badRequest('Invalid search parameters', parsed.error.flatten());
  }

  const { title, year } = parsed.data;
  const releases = await prowlarrService.searchMovie(title, year);
  res.json({ releases, query: year ? `${title} ${year}` : title });
});
