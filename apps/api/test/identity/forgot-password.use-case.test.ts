import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createForgotPasswordUseCase } from '../../src/modules/identity/application/use-cases/forgot-password.use-case.js';
import type { EmailPort } from '../../src/modules/identity/application/ports/email.port.js';
import type { AuthUser } from '../../src/modules/identity/domain/entities/auth-user.entity.js';
import type { AuthTokenRepository } from '../../src/modules/identity/domain/repositories/auth-token.repository.js';
import type { UserRepository } from '../../src/modules/identity/domain/repositories/user.repository.js';

describe('forgotPasswordUseCase', () => {
  const findActiveByEmail = vi.fn<UserRepository['findActiveByEmail']>();
  const createAndInvalidatePrevious = vi.fn<AuthTokenRepository['createAndInvalidatePrevious']>();
  const sendPasswordResetEmail = vi.fn<EmailPort['sendPasswordResetEmail']>();

  const mockUserRepo = {
    findActiveByEmail,
  } as unknown as UserRepository;

  const mockAuthTokenRepo = {
    createAndInvalidatePrevious,
  } as unknown as AuthTokenRepository;

  const mockEmailService = {
    sendPasswordResetEmail,
  } as unknown as EmailPort;

  const useCase = createForgotPasswordUseCase({
    userRepository: mockUserRepo,
    authTokenRepository: mockAuthTokenRepo,
    emailService: mockEmailService,
    passwordResetTtlMinutes: 15,
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes email, creates reset token and sends reset email for password users', async () => {
    findActiveByEmail.mockResolvedValueOnce(user);
    createAndInvalidatePrevious.mockResolvedValueOnce('reset-token');

    const result = await useCase.execute({ email: ' Test@Example.com ' });

    expect(findActiveByEmail).toHaveBeenCalledWith('test@example.com');
    expect(createAndInvalidatePrevious).toHaveBeenCalledWith({
      userId: 'user-1',
      purpose: 'PASSWORD_RESET',
      ttlMinutes: 15,
    });
    expect(sendPasswordResetEmail).toHaveBeenCalledWith({
      to: 'test@example.com',
      name: 'Test',
      token: 'reset-token',
    });
    expect(result.message).toContain('instructions');
  });

  it('does not reveal whether the email exists', async () => {
    findActiveByEmail.mockResolvedValueOnce(null);

    const result = await useCase.execute({ email: 'missing@example.com' });

    expect(createAndInvalidatePrevious).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(result.message).toContain('instructions');
  });

  it('does not send reset email for OAuth-only accounts', async () => {
    findActiveByEmail.mockResolvedValueOnce({ ...user, passwordHash: null });

    await useCase.execute({ email: 'test@example.com' });

    expect(createAndInvalidatePrevious).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
