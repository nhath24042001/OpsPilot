import { describe, expect, it, vi } from 'vitest';
import argon2 from 'argon2';
import { createLoginWithPasswordUseCase } from '../../src/modules/identity/application/use-cases/login-with-password.use-case.js';
import type { UserRepository } from '../../src/modules/identity/domain/repositories/user.repository.js';
import type { RefreshTokenRepository } from '../../src/modules/identity/domain/repositories/refresh-token.repository.js';
import type { TokenIssuerService } from '../../src/modules/identity/application/services/token-issuer.service.js';

vi.mock('argon2');

describe('loginWithPasswordUseCase', () => {
  const mockUserRepo = {
    findActiveByEmail: vi.fn(),
  } as unknown as UserRepository;

  const mockRefreshTokenRepo = {} as unknown as RefreshTokenRepository;

  const mockTokenIssuer = {
    issue: vi.fn(),
  } as unknown as TokenIssuerService;

  const useCase = createLoginWithPasswordUseCase({
    userRepository: mockUserRepo,
    refreshTokenRepository: mockRefreshTokenRepo,
    tokenIssuer: mockTokenIssuer,
  });

  const validUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    emailVerified: true,
    deletedAt: null,
    imageUrl: null,
    name: 'Test',
    createdAt: new Date(),
  };

  it('throws if user not found', async () => {
    vi.mocked(mockUserRepo.findActiveByEmail).mockResolvedValueOnce(null);

    await expect(useCase.execute({ email: 'test@example.com', password: 'pw' })).rejects.toHaveProperty(
      'code',
      'AUTH_ACCOUNT_NOT_FOUND',
    );
  });

  it('throws if email not verified', async () => {
    vi.mocked(mockUserRepo.findActiveByEmail).mockResolvedValueOnce({
      ...validUser,
      emailVerified: false,
    });

    await expect(useCase.execute({ email: 'test@example.com', password: 'pw' })).rejects.toHaveProperty(
      'code',
      'AUTH_EMAIL_NOT_VERIFIED',
    );
  });

  it('throws if OAuth-only account (no password hash)', async () => {
    vi.mocked(mockUserRepo.findActiveByEmail).mockResolvedValueOnce({
      ...validUser,
      passwordHash: null,
    });

    await expect(useCase.execute({ email: 'test@example.com', password: 'pw' })).rejects.toHaveProperty(
      'code',
      'AUTH_INVALID_PASSWORD',
    );
  });

  it('throws on invalid password', async () => {
    vi.mocked(mockUserRepo.findActiveByEmail).mockResolvedValueOnce(validUser);
    vi.mocked(argon2.verify).mockResolvedValueOnce(false);

    await expect(useCase.execute({ email: 'test@example.com', password: 'pw' })).rejects.toHaveProperty(
      'code',
      'AUTH_INVALID_PASSWORD',
    );
  });

  it('returns tokens on success', async () => {
    vi.mocked(mockUserRepo.findActiveByEmail).mockResolvedValueOnce(validUser);
    vi.mocked(argon2.verify).mockResolvedValueOnce(true);
    vi.mocked(mockTokenIssuer.issue).mockResolvedValueOnce({
      accessToken: 'access',
      refreshToken: 'refresh',
      storedRefreshTokenId: 'stored-1',
    });

    const result = await useCase.execute({ email: 'test@example.com', password: 'pw' });

    expect(result.tokens.accessToken).toBe('access');
    expect(result.tokens.refreshToken).toBe('refresh');
    expect(result.user.id).toBe('user-1');
  });
});
