import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLogoutUseCase } from '../../src/modules/identity/application/use-cases/logout.use-case.js';
import type {
  RefreshTokenRepository,
  StoredRefreshToken,
} from '../../src/modules/identity/domain/repositories/refresh-token.repository.js';
import { hashOpaqueToken } from '../../src/shared/crypto/token.js';

describe('logoutUseCase', () => {
  const findByHash = vi.fn<RefreshTokenRepository['findByHash']>();
  const revoke = vi.fn<RefreshTokenRepository['revoke']>();

  const mockRefreshTokenRepo = {
    findByHash,
    revoke,
  } as unknown as RefreshTokenRepository;

  const useCase = createLogoutUseCase({
    refreshTokenRepository: mockRefreshTokenRepo,
  });

  const storedToken: StoredRefreshToken = {
    id: 'token-1',
    userId: 'user-1',
    tokenHash: 'hash',
    familyId: 'family-1',
    replacedByTokenId: null,
    revokedAt: null,
    rotatedAt: null,
    expiresAt: new Date(Date.now() + 10000),
    createdAt: new Date(),
    user: {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test',
      imageUrl: null,
      passwordHash: 'hashed',
      emailVerified: true,
      createdAt: new Date(),
      deletedAt: null,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires a refresh token', async () => {
    await expect(useCase.execute({ refreshToken: '' })).rejects.toHaveProperty(
      'code',
      'AUTH_REFRESH_TOKEN_REQUIRED',
    );
  });

  it('revokes active stored refresh token', async () => {
    findByHash.mockResolvedValueOnce(storedToken);

    await useCase.execute({ refreshToken: 'refresh-token' });

    expect(findByHash).toHaveBeenCalledWith(hashOpaqueToken('refresh-token'));
    expect(revoke).toHaveBeenCalledWith('token-1', 'token-1');
  });

  it('does nothing when token is missing or already revoked', async () => {
    findByHash.mockResolvedValueOnce(null);
    await useCase.execute({ refreshToken: 'missing-token' });

    findByHash.mockResolvedValueOnce({ ...storedToken, revokedAt: new Date() });
    await useCase.execute({ refreshToken: 'revoked-token' });

    expect(revoke).not.toHaveBeenCalled();
  });
});
