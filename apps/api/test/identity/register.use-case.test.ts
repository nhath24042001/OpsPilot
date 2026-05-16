import { describe, expect, it, vi } from 'vitest';
import { createRegisterUseCase } from '../../src/modules/identity/application/use-cases/register.use-case.js';
import type { UserRepository } from '../../src/modules/identity/domain/repositories/user.repository.js';
import type { AuthTokenRepository } from '../../src/modules/identity/domain/repositories/auth-token.repository.js';
import type { EmailPort } from '../../src/modules/identity/application/ports/email.port.js';
import { domainError } from '../../src/shared/errors/app-error.js';

describe('registerUseCase', () => {
  const createPasswordUser = vi.fn<UserRepository['createPasswordUser']>();
  const createAndInvalidatePrevious = vi.fn<AuthTokenRepository['createAndInvalidatePrevious']>();
  const sendVerificationEmail = vi.fn<EmailPort['sendVerificationEmail']>();

  const mockUserRepo = {
    createPasswordUser,
  } as unknown as UserRepository;

  const mockAuthTokenRepo = {
    createAndInvalidatePrevious,
  } as unknown as AuthTokenRepository;

  const mockEmailService = {
    sendVerificationEmail,
  } as unknown as EmailPort;

  const useCase = createRegisterUseCase({
    userRepository: mockUserRepo,
    authTokenRepository: mockAuthTokenRepo,
    emailService: mockEmailService,
    emailVerificationTtlMinutes: 60,
  });

  it('creates user, generates token and sends email', async () => {
    createPasswordUser.mockResolvedValueOnce({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test',
      passwordHash: 'hashed',
      emailVerified: false,
      deletedAt: null,
      imageUrl: null,
      createdAt: new Date(),
    });

    createAndInvalidatePrevious.mockResolvedValueOnce('mock-token');

    const result = await useCase.execute({
      email: ' Test@Example.com ',
      password: 'password123',
      name: 'Test',
    });

    expect(createPasswordUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        name: 'Test',
      }),
    );
    expect(createAndInvalidatePrevious).toHaveBeenCalledWith({
      userId: 'user-1',
      purpose: 'EMAIL_VERIFICATION',
      ttlMinutes: 60,
    });
    expect(sendVerificationEmail).toHaveBeenCalledWith({
      to: 'test@example.com',
      name: 'Test',
      token: 'mock-token',
    });
    expect(result.emailVerificationSent).toBe(true);
    expect(result.user.email).toBe('test@example.com');
  });

  it('bubbles up database unique constraint error', async () => {
    createPasswordUser.mockRejectedValueOnce(domainError('DATABASE_UNIQUE_CONSTRAINT'));

    await expect(
      useCase.execute({
        email: 'test@example.com',
        password: 'password',
      }),
    ).rejects.toHaveProperty('code', 'DATABASE_UNIQUE_CONSTRAINT');
  });
});
