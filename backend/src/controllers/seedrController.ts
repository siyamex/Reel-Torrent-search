import type { Request, Response } from 'express';
import { z } from 'zod';
import { seedrService } from '../services/seedrService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

// These handlers sit behind requireAuth (mounted on the router), so
// req.session.userId is always present — every Seedr call here acts on
// that specific user's own connected account.

export const getQuota = asyncHandler(async (req: Request, res: Response) => {
  const quota = await seedrService.getQuota(req.session.userId as string);
  res.json(quota);
});

export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const tasks = await seedrService.listTasks(req.session.userId as string);
  res.json({ tasks });
});

// Accepts either a real magnet URI or a direct http(s) URL that resolves to
// a torrent file (e.g. Prowlarr's own download-proxy links, which many
// releases only expose instead of a raw magnet). seedrService detects which
// kind it is and handles each appropriately.
const createTaskSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1)
    .refine(
      (v) => v.startsWith('magnet:') || /^https?:\/\//i.test(v),
      'url must be a magnet URI or a direct http(s) torrent/download URL',
    ),
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest('Invalid request body', parsed.error.flatten());
  }

  await seedrService.createTask(req.session.userId as string, parsed.data.url);
  res.status(201).json({ success: true });
});

const taskIdParamSchema = z.object({ id: z.string().trim().min(1) });

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const parsed = taskIdParamSchema.safeParse(req.params);
  if (!parsed.success) throw ApiError.badRequest('Invalid task id');

  await seedrService.deleteTask(req.session.userId as string, parsed.data.id);
  res.json({ success: true });
});

const folderIdParamSchema = z.object({ id: z.string().trim().min(1) });

export const getFolderContents = asyncHandler(async (req: Request, res: Response) => {
  const parsed = folderIdParamSchema.safeParse(req.params);
  if (!parsed.success) throw ApiError.badRequest('Invalid folder id');

  const contents = await seedrService.getFolderContents(
    req.session.userId as string,
    parsed.data.id,
  );
  res.json({ contents });
});
