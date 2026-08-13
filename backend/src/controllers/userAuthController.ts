import type { Request, Response } from 'express';
import { z } from 'zod';
import { userAuthService } from '../services/userAuthService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { toPublicUser } from '../types/user';

const credentialsSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest('Invalid registration details', parsed.error.flatten());
  }

  const user = await userAuthService.register(parsed.data.username, parsed.data.password);

  // Regenerate the session on privilege change to avoid session fixation.
  await regenerateSession(req);
  req.session.userId = user.id;
  res.status(201).json({ user: toPublicUser(user) });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest('Invalid credentials', parsed.error.flatten());
  }

  const user = await userAuthService.login(parsed.data.username, parsed.data.password);

  await regenerateSession(req);
  req.session.userId = user.id;
  res.json({ user: toPublicUser(user) });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.clearCookie('reel.sid');
    res.json({ success: true });
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.session.userId) {
    res.json({ user: null });
    return;
  }

  const user = await userAuthService.getById(req.session.userId);
  if (!user) {
    res.json({ user: null });
    return;
  }

  res.json({ user: toPublicUser(user) });
});
