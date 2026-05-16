import { toPublicUser } from '../../domain/entities/auth-user.entity.js';
import type { AuthTokenRepository } from '../../domain/repositories/auth-token.repository.js';

type VerifyEmailInput = {
  token: string;
};

type VerifyEmailDeps = {
  authTokenRepository: AuthTokenRepository;
};

export const createVerifyEmailUseCase = (deps: VerifyEmailDeps) => ({
  async execute(input: VerifyEmailInput) {
    const user = await deps.authTokenRepository.consume({
      token: input.token,
      purpose: 'EMAIL_VERIFICATION',
    });

    return { user: toPublicUser(user), emailVerified: true };
  },
});
