import path from 'node:path';
import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { FileUserStore } from './FileUserStore';
import { RedisUserStore } from './RedisUserStore';
import type { UserStore } from './UserStore';

let store: UserStore = new FileUserStore(path.resolve(env.DATA_DIR));

/**
 * Attempts to connect to Redis if REDIS_URL is configured, for a
 * multi-instance-safe user store. Falls back to the file-backed store
 * (already assigned above) on any failure, so account creation/login still
 * works — just without cross-instance sharing.
 */
export async function initUserStore(): Promise<UserStore> {
  if (!env.REDIS_URL) {
    logger.info(`REDIS_URL not set, using file-backed user store at ${env.DATA_DIR}/users.json`);
    return store;
  }

  try {
    const client = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    await client.connect();
    store = new RedisUserStore(client);
    logger.info('Connected to Redis, using RedisUserStore');
  } catch (err) {
    logger.warn({ err }, 'Failed to connect Redis for user store, using file-backed store');
  }

  return store;
}

export function getUserStore(): UserStore {
  return store;
}
