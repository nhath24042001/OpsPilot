import type { AuthUser } from '../entities/auth-user.entity.js';

export type AuthTokenPurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

export type CreateAuthTokenInput = {
  userId: string;
  purpose: AuthTokenPurpose;
  ttlMinutes: number;
};

export type ConsumeAuthTokenInput = {
  token: string;
  purpose: AuthTokenPurpose;
};

export interface AuthTokenRepository {
  createAndInvalidatePrevious(input: CreateAuthTokenInput): Promise<string>;
  consume(input: ConsumeAuthTokenInput): Promise<AuthUser>;
}
