import { describe, expect, it, vi } from 'vitest';
import { createVerifyEmailUseCase } from '../../src/modules/identity/application/use-cases/verify-email.use-case.js';
import type { AuthUser } from '../../src/modules/identity/domain/entities/auth-user.entity.js';
import type { AuthTokenRepository } from '../../src/modules/identity/domain/repositories/auth-token.repository.js';

describe('verifyEmailUseCase', () => {
  const consume = vi.fn<AuthTokenRepository['consume']>();

  const mockAuthTokenRepo = {
    consume,
  } as unknown as AuthTokenRepository;

  const useCase = createVerifyEmailUseCase({
    authTokenRepository: mockAuthTokenRepo,
  });

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

  it('consumes email verification token and returns public user', async () => {
    consume.mockResolvedValueOnce(user);

    const result = await useCase.execute({ token: 'verify-token' });

    expect(consume).toHaveBeenCalledWith({
      token: 'verify-token',
      purpose: 'EMAIL_VERIFICATION',
    });
    expect(result.emailVerified).toBe(true);
    expect(result.user).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test',
      imageUrl: null,
      emailVerified: true,
      createdAt: user.createdAt,
    });
  });
});
