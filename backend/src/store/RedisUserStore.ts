import type Redis from 'ioredis';
import type { SeedrTokens } from '../types/seedr';
import type { User } from '../types/user';
import type { UserStore } from './UserStore';

const userKey = (id: string) => `user:${id}`;
const usernameIndexKey = (username: string) => `user:by-username:${username.toLowerCase()}`;

export class RedisUserStore implements UserStore {
  constructor(private readonly client: Redis) {}

  async getById(id: string): Promise<User | undefined> {
    const raw = await this.client.get(userKey(id));
    return raw ? (JSON.parse(raw) as User) : undefined;
  }

  async getByUsername(username: string): Promise<User | undefined> {
    const id = await this.client.get(usernameIndexKey(username));
    if (!id) return undefined;
    return this.getById(id);
  }

  async create(user: User): Promise<void> {
    await this.client
      .multi()
      .set(userKey(user.id), JSON.stringify(user))
      .set(usernameIndexKey(user.username), user.id)
      .exec();
  }

  async setSeedrTokens(userId: string, tokens: SeedrTokens): Promise<void> {
    const user = await this.getById(userId);
    if (!user) return;
    await this.client.set(userKey(userId), JSON.stringify({ ...user, seedr: tokens }));
  }

  async clearSeedrTokens(userId: string): Promise<void> {
    const user = await this.getById(userId);
    if (!user) return;
    const { seedr: _seedr, ...rest } = user;
    await this.client.set(userKey(userId), JSON.stringify(rest));
  }
}
