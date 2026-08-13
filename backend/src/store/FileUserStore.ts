import { promises as fs } from 'node:fs';
import path from 'node:path';
import { logger } from '../utils/logger';
import type { SeedrTokens } from '../types/seedr';
import type { User } from '../types/user';
import type { UserStore } from './UserStore';

/**
 * JSON-file-backed user store for local development without Redis. Users
 * are persisted to disk so accounts survive server restarts. Writes are
 * serialized through a promise chain since Node is single-threaded and this
 * app has a tiny user base — no real concurrency risk, just avoiding
 * interleaved read-modify-write races between requests.
 */
export class FileUserStore implements UserStore {
  private readonly filePath: string;
  private writeQueue: Promise<unknown> = Promise.resolve();
  private cache: Map<string, User> | null = null;

  constructor(dataDir: string) {
    this.filePath = path.join(dataDir, 'users.json');
  }

  private async load(): Promise<Map<string, User>> {
    if (this.cache) return this.cache;

    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      const users = JSON.parse(raw) as User[];
      this.cache = new Map(users.map((u) => [u.id, u]));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.warn({ err }, 'Failed to read users.json, starting with an empty user store');
      }
      this.cache = new Map();
    }

    return this.cache;
  }

  private async persist(): Promise<void> {
    const users = this.cache ?? new Map<string, User>();
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify([...users.values()], null, 2), 'utf-8');
  }

  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.writeQueue.then(fn);
    this.writeQueue = result.catch(() => undefined);
    return result;
  }

  async getById(id: string): Promise<User | undefined> {
    const users = await this.load();
    return users.get(id);
  }

  async getByUsername(username: string): Promise<User | undefined> {
    const users = await this.load();
    const needle = username.toLowerCase();
    return [...users.values()].find((u) => u.username.toLowerCase() === needle);
  }

  async create(user: User): Promise<void> {
    return this.enqueue(async () => {
      const users = await this.load();
      users.set(user.id, user);
      await this.persist();
    });
  }

  async setSeedrTokens(userId: string, tokens: SeedrTokens): Promise<void> {
    return this.enqueue(async () => {
      const users = await this.load();
      const user = users.get(userId);
      if (!user) return;
      users.set(userId, { ...user, seedr: tokens });
      await this.persist();
    });
  }

  async clearSeedrTokens(userId: string): Promise<void> {
    return this.enqueue(async () => {
      const users = await this.load();
      const user = users.get(userId);
      if (!user) return;
      const { seedr: _seedr, ...rest } = user;
      users.set(userId, rest);
      await this.persist();
    });
  }
}
