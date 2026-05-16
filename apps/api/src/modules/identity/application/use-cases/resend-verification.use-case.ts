import type { AuthTokenRepository } from '../../domain/repositories/auth-token.repository.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import type { EmailPort } from '../ports/email.port.js';

type ResendVerificationInput = {
  email: string;
};

type ResendVerificationDeps = {
  userRepository: UserRepository;
  authTokenRepository: AuthTokenRepository;
  emailService: EmailPort;
  emailVerificationTtlMinutes: number;
};

const publicMessage = {
  message: 'If the email is eligible, a verification email will be sent shortly.',
};

export const createResendVerificationUseCase = (deps: ResendVerificationDeps) => ({
  async execute(input: ResendVerificationInput) {
    const email = input.email.toLowerCase().trim();
    const user = await deps.userRepository.findActiveByEmail(email);

    if (!user || user.emailVerified) {
      return publicMessage;
    }

    const token = await deps.authTokenRepository.createAndInvalidatePrevious({
      userId: user.id,
      purpose: 'EMAIL_VERIFICATION',
      ttlMinutes: deps.emailVerificationTtlMinutes,
    });

    await deps.emailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      token,
    });

    return publicMessage;
  },
});
