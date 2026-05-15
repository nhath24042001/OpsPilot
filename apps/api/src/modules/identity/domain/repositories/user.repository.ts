import type { AuthUser } from '../entities/auth-user.entity.js';

export type CreatePasswordUserInput = {
  email: string;
  passwordHash: string;
  name?: string;
};

export interface UserRepository {
  createPasswordUser(input: CreatePasswordUserInput): Promise<AuthUser>;
  findActiveByEmail(email: string): Promise<AuthUser | null>;
  findActiveById(id: string): Promise<AuthUser | null>;
}
