import argon2 from 'argon2';
import { describe, expect, it, vi } from 'vitest';
import { createResetPasswordUseCase } from '../../src/modules/identity/application/use-cases/reset-password.use-case.js';
import type { AuthUser } from '../../src/modules/identity/domain/entities/auth-user.entity.js';
import type { AuthTokenRepository } from '../../src/modules/identity/domain/repositories/auth-token.repository.js';
import type { RefreshTokenRepository } from '../../src/modules/identity/domain/repositories/refresh-token.repository.js';
import type { UserRepository } from '../../src/modules/identity/domain/repositories/user.repository.js';

vi.mock('argon2');

describe('resetPasswordUseCase', () => {
  const consume = vi.fn<AuthTokenRepository['consume']>();
  const updatePassword = vi.fn<UserRepository['updatePassword']>();
  const revokeAllForUser = vi.fn<RefreshTokenRepository['revokeAllForUser']>();

  const mockAuthTokenRepo = {
    consume,
  } as unknown as AuthTokenRepository;

  const mockUserRepo = {
    updatePassword,
  } as unknown as UserRepository;

  const mockRefreshTokenRepo = {
    revokeAllForUser,
  } as unknown as RefreshTokenRepository;

  const useCase = createResetPasswordUseCase({
    authTokenRepository: mockAuthTokenRepo,
    userRepository: mockUserRepo,
    refreshTokenRepository: mockRefreshTokenRepo,
  });

  const user: AuthUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test',
    imageUrl: null,
    passwordHash: 'old-hash',
    emailVerified: true,
    createdAt: new Date(),
    deletedAt: null,
  };

  it('hashes password, consumes reset token, updates password and revokes refresh tokens', async () => {
    vi.mocked(argon2.hash).mockResolvedValueOnce('new-hash');
    consume.mockResolvedValueOnce(user);

    const result = await useCase.execute({ token: 'reset-token', password: 'new-password' });

    expect(argon2.hash).toHaveBeenCalledWith('new-password');
    expect(consume).toHaveBeenCalledWith({
      token: 'reset-token',
      purpose: 'PASSWORD_RESET',
    });
    expect(updatePassword).toHaveBeenCalledWith('user-1', 'new-hash');
    expect(revokeAllForUser).toHaveBeenCalledWith('user-1');
    expect(result.passwordReset).toBe(true);
  });
});
