import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import type { CacheService } from './CacheService';
import { MemoryCache } from './MemoryCache';
import { RedisCache } from './RedisCache';

const memoryFallback = new MemoryCache();

let cache: CacheService = memoryFallback;

/**
 * Attempts to connect to Redis if REDIS_URL is configured. On any failure,
 * silently keeps using the in-memory cache so the app stays functional.
 */
export async function initCache(): Promise<CacheService> {
  if (!env.REDIS_URL) {
    logger.info('REDIS_URL not set, using in-memory cache');
    return cache;
  }

  const client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });

  try {
    await client.connect();
    cache = new RedisCache(client);
    logger.info('Connected to Redis, using RedisCache');

    client.on('error', (err) => {
      logger.error({ err }, 'Redis connection error, falling back to in-memory cache');
      cache = memoryFallback;
    });
  } catch (err) {
    logger.warn({ err }, 'Failed to connect to Redis, using in-memory cache');
    cache = memoryFallback;
  }

  return cache;
}

export function getCache(): CacheService {
  return cache;
}
