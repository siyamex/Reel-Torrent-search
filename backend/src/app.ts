import express, { type Express, type RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import routes from './routes';

export function createApp(sessionMiddleware: RequestHandler): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json());
  app.use(sessionMiddleware);
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));

  const rateLimitHandler = (_req: express.Request, res: express.Response): void => {
    res.status(429).json({
      error: 'rate_limited',
      error_description: 'Too many requests. Please wait a moment and try again.',
    });
  };

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
  });
  app.use('/api', apiLimiter);

  // Tighter limit on login/register specifically, to slow down credential
  // stuffing / brute-force attempts against the app's own auth.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
  });
  app.use(['/api/auth/login', '/api/auth/register'], authLimiter);

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
