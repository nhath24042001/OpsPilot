import argon2 from 'argon2';
import type { AuthTokenRepository } from '../../domain/repositories/auth-token.repository.js';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';

type ResetPasswordInput = {
  token: string;
  password: string;
};

type ResetPasswordDeps = {
  authTokenRepository: AuthTokenRepository;
  userRepository: UserRepository;
  refreshTokenRepository: RefreshTokenRepository;
};

export const createResetPasswordUseCase = (deps: ResetPasswordDeps) => ({
  async execute(input: ResetPasswordInput) {
    const passwordHash = await argon2.hash(input.password);

    const user = await deps.authTokenRepository.consume({
      token: input.token,
      purpose: 'PASSWORD_RESET',
    });

    await deps.userRepository.updatePassword(user.id, passwordHash);

    await deps.refreshTokenRepository.revokeAllForUser(user.id);

    return { passwordReset: true };
  },
});
