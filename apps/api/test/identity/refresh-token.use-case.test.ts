import { describe, expect, it, vi } from 'vitest';
import { createRefreshTokenUseCase } from '../../src/modules/identity/application/use-cases/refresh-token.use-case.js';
import type { RefreshTokenRepository } from '../../src/modules/identity/domain/repositories/refresh-token.repository.js';
import type { UserRepository } from '../../src/modules/identity/domain/repositories/user.repository.js';
import type { TokenIssuerService } from '../../src/modules/identity/application/services/token-issuer.service.js';
import * as jwt from '../../src/shared/auth/jwt.js';

vi.mock('../../src/shared/auth/jwt.js');

describe('refreshTokenUseCase', () => {
  const mockRefreshTokenRepo = {
    findByHash: vi.fn(),
    revokeFamily: vi.fn(),
    revoke: vi.fn(),
  } as unknown as RefreshTokenRepository;

  const mockUserRepo = {} as unknown as UserRepository;

  const mockTokenIssuer = {
    issue: vi.fn(),
  } as unknown as TokenIssuerService;

  const useCase = createRefreshTokenUseCase({
    refreshTokenRepository: mockRefreshTokenRepo,
    userRepository: mockUserRepo,
    tokenIssuer: mockTokenIssuer,
  });

  const validStoredToken = {
    id: 'token-1',
    familyId: 'family-1',
    userId: 'user-1',
    revokedAt: null,
    expiresAt: new Date(Date.now() + 10000),
    user: { id: 'user-1', deletedAt: null },
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
    vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValueOnce(null);

    await expect(useCase.execute({ refreshToken: 'token' })).rejects.toHaveProperty(
      'code',
      'AUTH_INVALID_REFRESH_TOKEN',
    );
  });

  it('detects reuse and revokes family', async () => {
    vi.mocked(jwt.verifyRefreshToken).mockReturnValue({ sub: 'user-1', email: 'test@test.com' });
    vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValueOnce({
      ...validStoredToken,
      revokedAt: new Date(), // Already revoked!
    } as any);

    await expect(useCase.execute({ refreshToken: 'token' })).rejects.toHaveProperty(
      'code',
      'AUTH_REFRESH_TOKEN_REUSE_DETECTED',
    );

    expect(mockRefreshTokenRepo.revokeFamily).toHaveBeenCalledWith('family-1');
  });

  it('issues new tokens on success', async () => {
    vi.mocked(jwt.verifyRefreshToken).mockReturnValue({ sub: 'user-1', email: 'test@test.com' });
    vi.mocked(mockRefreshTokenRepo.findByHash).mockResolvedValueOnce(validStoredToken as any);
    vi.mocked(mockTokenIssuer.issue).mockResolvedValueOnce({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      storedRefreshTokenId: 'new-stored-id',
    });

    const result = await useCase.execute({ refreshToken: 'token' });

    expect(result.tokens.accessToken).toBe('new-access');
    expect(mockRefreshTokenRepo.revoke).toHaveBeenCalledWith('token-1', 'new-stored-id');
  });
});
