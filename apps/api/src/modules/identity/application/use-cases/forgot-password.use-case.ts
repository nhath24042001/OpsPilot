import type { AuthTokenRepository } from '../../domain/repositories/auth-token.repository.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import type { EmailPort } from '../ports/email.port.js';

type ForgotPasswordInput = {
  email: string;
};

type ForgotPasswordDeps = {
  userRepository: UserRepository;
  authTokenRepository: AuthTokenRepository;
  emailService: EmailPort;
  passwordResetTtlMinutes: number;
};

const publicMessage = {
  message: 'If the email is eligible, instructions will be sent shortly.',
};

export const createForgotPasswordUseCase = (deps: ForgotPasswordDeps) => ({
  async execute(input: ForgotPasswordInput) {
    const email = input.email.toLowerCase().trim();
    const user = await deps.userRepository.findActiveByEmail(email);

    if (!user?.passwordHash) {
      return publicMessage;
    }

    const token = await deps.authTokenRepository.createAndInvalidatePrevious({
      userId: user.id,
      purpose: 'PASSWORD_RESET',
      ttlMinutes: deps.passwordResetTtlMinutes,
    });

    await deps.emailService.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token,
    });

    return publicMessage;
  },
});
