import { describe, expect, it, vi } from 'vitest';
import { createTokenIssuerService } from '../../src/modules/identity/application/services/token-issuer.service.js';
import type { AuthUser } from '../../src/modules/identity/domain/entities/auth-user.entity.js';
import type {
  RefreshTokenRepository,
  StoredRefreshToken,
} from '../../src/modules/identity/domain/repositories/refresh-token.repository.js';
import { hashOpaqueToken } from '../../src/shared/crypto/token.js';
import * as jwt from '../../src/shared/auth/jwt.js';

vi.mock('../../src/shared/auth/jwt.js');

describe('tokenIssuerService', () => {
  const create = vi.fn<RefreshTokenRepository['create']>();

  const mockRefreshTokenRepo = {
    create,
  } as unknown as RefreshTokenRepository;

  const user: AuthUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test',
    imageUrl: null,
    passwordHash: 'hashed',
    emailVerified: true,
    createdAt: new Date(),
    deletedAt: null,
  };

  const storedToken: StoredRefreshToken = {
    id: 'stored-token-1',
    userId: 'user-1',
    tokenHash: 'hash',
    familyId: 'family-1',
    replacedByTokenId: null,
    revokedAt: null,
    rotatedAt: null,
    expiresAt: new Date(Date.now() + 10000),
    createdAt: new Date(),
    user,
  };

  it('signs access and refresh tokens and persists the refresh token hash', async () => {
    vi.mocked(jwt.signAccessToken).mockReturnValueOnce('access-token');
    vi.mocked(jwt.signRefreshToken).mockReturnValueOnce('refresh-token');
    create.mockResolvedValueOnce(storedToken);

    const result = await createTokenIssuerService().issue(user, mockRefreshTokenRepo, 'family-1');

    expect(jwt.signAccessToken).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'test@example.com',
    });
    expect(jwt.signRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 'user-1',
        email: 'test@example.com',
      }),
    );
    expect(create).toHaveBeenCalledTimes(1);
    const input = create.mock.calls[0]?.[0];
    expect(input).toBeDefined();
    if (!input) {
      throw new Error('Expected refresh token to be persisted');
    }
    expect(input.userId).toBe('user-1');
    expect(input.familyId).toBe('family-1');
    expect(input.tokenHash).toBe(hashOpaqueToken('refresh-token'));
    expect(input.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      storedRefreshTokenId: 'stored-token-1',
    });
  });
});
