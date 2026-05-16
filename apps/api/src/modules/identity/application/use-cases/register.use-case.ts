import argon2 from 'argon2';
import { toPublicUser } from '../../domain/entities/auth-user.entity.js';
import type { AuthTokenRepository } from '../../domain/repositories/auth-token.repository.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import type { EmailPort } from '../ports/email.port.js';

type RegisterInput = {
  email: string;
  password: string;
  name?: string;
};

type RegisterDeps = {
  userRepository: UserRepository;
  authTokenRepository: AuthTokenRepository;
  emailService: EmailPort;
  emailVerificationTtlMinutes: number;
};

export const createRegisterUseCase = (deps: RegisterDeps) => ({
  async execute(input: RegisterInput) {
    const email = input.email.toLowerCase().trim();
    const passwordHash = await argon2.hash(input.password);

    const user = await deps.userRepository.createPasswordUser({
      email,
      passwordHash,
      name: input.name,
    });

    const verificationToken = await deps.authTokenRepository.createAndInvalidatePrevious({
      userId: user.id,
      purpose: 'EMAIL_VERIFICATION',
      ttlMinutes: deps.emailVerificationTtlMinutes,
    });

    await deps.emailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      token: verificationToken,
    });

    return {
      user: toPublicUser(user),
      emailVerificationSent: true,
    };
  },
});
