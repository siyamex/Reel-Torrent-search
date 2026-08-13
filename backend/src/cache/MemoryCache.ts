import { logger } from '../utils/logger';
import type { CacheService } from './CacheService';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Simple in-process TTL cache used as a fallback when Redis is not
 * configured or unreachable. Not shared across processes/instances.
 */
export class MemoryCache implements CacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private sweepTimer: NodeJS.Timeout;

  constructor() {
    this.sweepTimer = setInterval(() => this.sweep(), 5 * 60 * 1000);
    this.sweepTimer.unref();
  }

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async getOrSet<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) return cached;

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  private sweep(): void {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.store) {
      if (entry.expiresAt < now) {
        this.store.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      logger.debug({ removed }, 'MemoryCache sweep removed expired entries');
    }
  }
}
