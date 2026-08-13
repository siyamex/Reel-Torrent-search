import session, { type SessionOptions } from 'express-session';
import RedisStore from 'connect-redis';
import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

/**
 * Builds the express-session middleware. Prefers a Redis-backed store (so
 * Seedr tokens survive restarts and work across multiple instances); falls
 * back to the default in-memory store for local development if Redis isn't
 * configured or reachable.
 */
export async function createSessionMiddleware() {
  let store: SessionOptions['store'];

  if (env.REDIS_URL) {
    try {
      const client = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
      await client.connect();
      store = new RedisStore({ client, prefix: 'sess:' });
      logger.info('Using Redis-backed session store');
    } catch (err) {
      logger.warn({ err }, 'Failed to connect Redis for sessions; using in-memory session store');
    }
  }

  if (!store) {
    logger.warn(
      'No Redis session store configured — using in-memory sessions. Fine for local development, but not for production or multi-instance deployments.',
    );
  }

  return session({
    name: 'reel.sid',
    secret: env.SESSION_SECRET,
    store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: 'lax',
      maxAge: THIRTY_DAYS_MS,
    },
  });
}
