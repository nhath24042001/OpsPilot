import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createResendVerificationUseCase } from '../../src/modules/identity/application/use-cases/resend-verification.use-case.js';
import type { EmailPort } from '../../src/modules/identity/application/ports/email.port.js';
import type { AuthUser } from '../../src/modules/identity/domain/entities/auth-user.entity.js';
import type { AuthTokenRepository } from '../../src/modules/identity/domain/repositories/auth-token.repository.js';
import type { UserRepository } from '../../src/modules/identity/domain/repositories/user.repository.js';

describe('resendVerificationUseCase', () => {
  const findActiveByEmail = vi.fn<UserRepository['findActiveByEmail']>();
  const createAndInvalidatePrevious = vi.fn<AuthTokenRepository['createAndInvalidatePrevious']>();
  const sendVerificationEmail = vi.fn<EmailPort['sendVerificationEmail']>();

  const mockUserRepo = {
    findActiveByEmail,
  } as unknown as UserRepository;

  const mockAuthTokenRepo = {
    createAndInvalidatePrevious,
  } as unknown as AuthTokenRepository;

  const mockEmailService = {
    sendVerificationEmail,
  } as unknown as EmailPort;

  const useCase = createResendVerificationUseCase({
    userRepository: mockUserRepo,
    authTokenRepository: mockAuthTokenRepo,
    emailService: mockEmailService,
    emailVerificationTtlMinutes: 60,
  });

  const unverifiedUser: AuthUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test',
    imageUrl: null,
    passwordHash: 'hashed',
    emailVerified: false,
    createdAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes email and sends verification email for unverified users', async () => {
    findActiveByEmail.mockResolvedValueOnce(unverifiedUser);
    createAndInvalidatePrevious.mockResolvedValueOnce('verify-token');

    const result = await useCase.execute({ email: ' Test@Example.com ' });

    expect(findActiveByEmail).toHaveBeenCalledWith('test@example.com');
    expect(createAndInvalidatePrevious).toHaveBeenCalledWith({
      userId: 'user-1',
      purpose: 'EMAIL_VERIFICATION',
      ttlMinutes: 60,
    });
    expect(sendVerificationEmail).toHaveBeenCalledWith({
      to: 'test@example.com',
      name: 'Test',
      token: 'verify-token',
    });
    expect(result.message).toContain('verification email');
  });

  it('does not reveal missing users', async () => {
    findActiveByEmail.mockResolvedValueOnce(null);

    const result = await useCase.execute({ email: 'missing@example.com' });

    expect(createAndInvalidatePrevious).not.toHaveBeenCalled();
    expect(sendVerificationEmail).not.toHaveBeenCalled();
    expect(result.message).toContain('verification email');
  });

  it('does not send email for already verified users', async () => {
    findActiveByEmail.mockResolvedValueOnce({ ...unverifiedUser, emailVerified: true });

    await useCase.execute({ email: 'test@example.com' });

    expect(createAndInvalidatePrevious).not.toHaveBeenCalled();
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });
});
