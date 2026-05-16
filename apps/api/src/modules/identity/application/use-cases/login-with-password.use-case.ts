import argon2 from 'argon2';
import { domainError } from '../../../../shared/errors/app-error.js';
import { toPublicUser } from '../../domain/entities/auth-user.entity.js';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import type { TokenIssuerService } from '../services/token-issuer.service.js';

type LoginWithPasswordInput = {
  email: string;
  password: string;
};

type LoginWithPasswordDeps = {
  userRepository: UserRepository;
  refreshTokenRepository: RefreshTokenRepository;
  tokenIssuer: TokenIssuerService;
};

export const createLoginWithPasswordUseCase = (deps: LoginWithPasswordDeps) => ({
  async execute(input: LoginWithPasswordInput) {
    const user = await deps.userRepository.findActiveByEmail(input.email.toLowerCase().trim());

    if (!user) {
      throw domainError('AUTH_ACCOUNT_NOT_FOUND');
    }

    if (!user.emailVerified) {
      throw domainError('AUTH_EMAIL_NOT_VERIFIED');
    }

    if (!user.passwordHash) {
      throw domainError('AUTH_INVALID_PASSWORD');
    }

    const validPassword = await argon2.verify(user.passwordHash, input.password);
    if (!validPassword) {
      throw domainError('AUTH_INVALID_PASSWORD');
    }

    const tokens = await deps.tokenIssuer.issue(user, deps.refreshTokenRepository);

    return {
      user: toPublicUser(user),
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  },
});

