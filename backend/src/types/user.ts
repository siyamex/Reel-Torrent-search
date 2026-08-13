import type { SeedrTokens } from './seedr';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  /** Present once this user has connected their own Seedr account. */
  seedr?: SeedrTokens;
}

export type PublicUser = Pick<User, 'id' | 'username' | 'createdAt'> & {
  seedrConnected: boolean;
};

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
    seedrConnected: Boolean(user.seedr),
  };
}
