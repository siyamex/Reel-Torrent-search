import type { Request, Response } from 'express';
import { z } from 'zod';
import { seedrService } from '../services/seedrService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

// These handlers sit behind requireAuth (mounted on the router), so
// req.session.userId is always present here — that's whose Seedr account
// this connects.

const connectSchema = z.object({
  email: z.string().trim().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const connect = asyncHandler(async (req: Request, res: Response) => {
  const parsed = connectSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest('Invalid request body', parsed.error.flatten());
  }

  const tokens = await seedrService.loginWithPassword(parsed.data.email, parsed.data.password);
  await seedrService.connectUser(req.session.userId as string, tokens);
  res.json({ success: true });
});

export const status = asyncHandler(async (req: Request, res: Response) => {
  const connected = await seedrService.isUserConnected(req.session.userId as string);
  res.json({ connected });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await seedrService.disconnectUser(req.session.userId as string);
  res.json({ success: true });
});
