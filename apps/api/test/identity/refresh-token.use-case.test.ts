import { describe, expect, it, vi } from 'vitest';
import { createRefreshTokenUseCase } from '../../src/modules/identity/application/use-cases/refresh-token.use-case.js';
import type { RefreshTokenRepository } from '../../src/modules/identity/domain/repositories/refresh-token.repository.js';
import type { StoredRefreshToken } from '../../src/modules/identity/domain/repositories/refresh-token.repository.js';
import type { UserRepository } from '../../src/modules/identity/domain/repositories/user.repository.js';
import type { TokenIssuerService } from '../../src/modules/identity/application/services/token-issuer.service.js';
import * as jwt from '../../src/shared/auth/jwt.js';

vi.mock('../../src/shared/auth/jwt.js');

describe('refreshTokenUseCase', () => {
  const findByHash = vi.fn<RefreshTokenRepository['findByHash']>();
  const revokeFamily = vi.fn<RefreshTokenRepository['revokeFamily']>();
  const revoke = vi.fn<RefreshTokenRepository['revoke']>();
  const issue = vi.fn<TokenIssuerService['issue']>();

  const mockRefreshTokenRepo = {
    findByHash,
    revokeFamily,
    revoke,
  } as unknown as RefreshTokenRepository;

  const mockUserRepo = {} as unknown as UserRepository;

  const mockTokenIssuer = {
    issue,
  } as unknown as TokenIssuerService;

  const useCase = createRefreshTokenUseCase({
    refreshTokenRepository: mockRefreshTokenRepo,
    userRepository: mockUserRepo,
    tokenIssuer: mockTokenIssuer,
  });

  const validStoredToken: StoredRefreshToken = {
    id: 'token-1',
    familyId: 'family-1',
    userId: 'user-1',
    tokenHash: 'token-hash',
    replacedByTokenId: null,
    revokedAt: null,
    rotatedAt: null,
    expiresAt: new Date(Date.now() + 10000),
    createdAt: new Date(),
    user: {
      id: 'user-1',
      email: 'test@test.com',
      passwordHash: 'hashed',
      emailVerified: true,
      deletedAt: null,
      imageUrl: null,
      name: 'Test',
      createdAt: new Date(),
    },
  };

  it('throws on invalid JWT', async () => {
    vi.mocked(jwt.verifyRefreshToken).mockImplementation(() => {
      throw new Error('invalid');
    });

    await expect(useCase.execute({ refreshToken: 'bad-token' })).rejects.toHaveProperty(
      'code',
      'AUTH_INVALID_REFRESH_TOKEN',
    );
  });

  it('throws on missing stored token', async () => {
    vi.mocked(jwt.verifyRefreshToken).mockReturnValue({ sub: 'user-1', email: 'test@test.com' });
    findByHash.mockResolvedValueOnce(null);

    await expect(useCase.execute({ refreshToken: 'token' })).rejects.toHaveProperty(
      'code',
      'AUTH_INVALID_REFRESH_TOKEN',
    );
  });

  it('detects reuse and revokes family', async () => {
    vi.mocked(jwt.verifyRefreshToken).mockReturnValue({ sub: 'user-1', email: 'test@test.com' });
    findByHash.mockResolvedValueOnce({
      ...validStoredToken,
      revokedAt: new Date(), // Already revoked!
    });

    await expect(useCase.execute({ refreshToken: 'token' })).rejects.toHaveProperty(
      'code',
      'AUTH_REFRESH_TOKEN_REUSE_DETECTED',
    );

    expect(revokeFamily).toHaveBeenCalledWith('family-1');
  });

  it('issues new tokens on success', async () => {
    vi.mocked(jwt.verifyRefreshToken).mockReturnValue({ sub: 'user-1', email: 'test@test.com' });
    findByHash.mockResolvedValueOnce(validStoredToken);
    issue.mockResolvedValueOnce({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      storedRefreshTokenId: 'new-stored-id',
    });

    const result = await useCase.execute({ refreshToken: 'token' });

    expect(result.tokens.accessToken).toBe('new-access');
    expect(revoke).toHaveBeenCalledWith('token-1', 'new-stored-id');
  });
});
