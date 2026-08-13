import crypto from 'node:crypto';
import { getUserStore } from '../store';
import { ApiError } from '../utils/ApiError';
import { hashPassword, verifyPassword } from '../utils/password';
import type { User } from '../types/user';

const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,32}$/;

function assertValidUsername(username: string): void {
  if (!USERNAME_PATTERN.test(username)) {
    throw ApiError.badRequest(
      'Username must be 3-32 characters and contain only letters, numbers, dots, underscores, or hyphens.',
    );
  }
}

function assertValidPassword(password: string): void {
  if (password.length < 8) {
    throw ApiError.badRequest('Password must be at least 8 characters.');
  }
}

async function register(username: string, password: string): Promise<User> {
  assertValidUsername(username);
  assertValidPassword(password);

  const store = getUserStore();
  const existing = await store.getByUsername(username);
  if (existing) {
    throw ApiError.badRequest('That username is already taken.');
  }

  const user: User = {
    id: crypto.randomUUID(),
    username,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  await store.create(user);
  return user;
}

async function login(username: string, password: string): Promise<User> {
  const store = getUserStore();
  const user = await store.getByUsername(username);
  if (!user) {
    throw ApiError.unauthorized('Incorrect username or password.');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized('Incorrect username or password.');
  }

  return user;
}

async function getById(id: string): Promise<User | undefined> {
  return getUserStore().getById(id);
}

export const userAuthService = {
  register,
  login,
  getById,
};
