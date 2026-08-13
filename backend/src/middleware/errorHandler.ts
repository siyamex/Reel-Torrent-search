import type { NextFunction, Request, Response } from 'express';
import { isAxiosError } from 'axios';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { isProduction } from '../config/env';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else if (isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 401 || status === 403) {
      apiError = new ApiError(502, 'Upstream service rejected the request (invalid credentials)');
    } else if (status === 429) {
      apiError = new ApiError(
        429,
        'Rate limit exceeded on an upstream service. Please wait a moment and try again.',
      );
    } else if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      apiError = ApiError.gatewayTimeout('Upstream service timed out');
    } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      apiError = ApiError.badGateway('Upstream service is unreachable');
    } else {
      apiError = ApiError.badGateway('Upstream service returned an error', err.response?.data);
    }
  } else if (err instanceof Error) {
    apiError = ApiError.internal(err.message);
  } else {
    apiError = ApiError.internal('Unknown error');
  }

  const log = { err, path: req.originalUrl, method: req.method, statusCode: apiError.statusCode };
  if (apiError.statusCode >= 500) {
    logger.error(log, 'Request failed');
  } else {
    logger.warn(log, 'Request failed');
  }

  res.status(apiError.statusCode).json({
    error: apiError.name === 'ApiError' ? 'request_failed' : apiError.name,
    error_description: apiError.message,
    ...(isProduction ? {} : { details: apiError.details }),
  });
}
