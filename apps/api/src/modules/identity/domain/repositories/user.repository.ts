import type { AuthUser } from '../entities/auth-user.entity.js';

export type CreatePasswordUserInput = {
  email: string;
  passwordHash: string;
  name?: string;
};

export type UpsertOAuthUserInput = {
  email: string;
  name: string | null;
  imageUrl: string | null;
  emailVerified: boolean;
};

export interface UserRepository {
  createPasswordUser(input: CreatePasswordUserInput): Promise<AuthUser>;
  findActiveByEmail(email: string): Promise<AuthUser | null>;
  findActiveById(id: string): Promise<AuthUser | null>;
  markEmailVerified(userId: string): Promise<void>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
  upsertFromOAuth(input: UpsertOAuthUserInput): Promise<AuthUser>;
}
