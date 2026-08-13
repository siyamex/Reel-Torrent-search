export interface CacheService {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  /**
   * Returns the cached value for `key` if present; otherwise invokes
   * `factory`, caches its result for `ttlSeconds`, and returns it.
   */
  getOrSet<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T>;
}
