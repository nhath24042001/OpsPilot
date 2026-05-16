import type { AuthUser } from '../entities/auth-user.entity.js';

export type StoredRefreshToken = {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  replacedByTokenId: string | null;
  revokedAt: Date | null;
  rotatedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  user: AuthUser;
};

export type CreateRefreshTokenInput = {
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
};

export interface RefreshTokenRepository {
  create(input: CreateRefreshTokenInput): Promise<StoredRefreshToken>;
  findByHash(tokenHash: string): Promise<StoredRefreshToken | null>;
  revoke(tokenId: string, replacedByTokenId: string): Promise<void>;
  revokeFamily(familyId: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}
