import type { SeedrTokens } from '../types/seedr';
import type { User } from '../types/user';

export interface UserStore {
  getById(id: string): Promise<User | undefined>;
  getByUsername(username: string): Promise<User | undefined>;
  create(user: User): Promise<void>;
  setSeedrTokens(userId: string, tokens: SeedrTokens): Promise<void>;
  clearSeedrTokens(userId: string): Promise<void>;
}
