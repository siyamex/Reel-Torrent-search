import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    next(ApiError.unauthorized('Please log in to continue.'));
    return;
  }
  next();
}
