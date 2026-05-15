import argon2 from 'argon2';
import { domainError } from '../../../../shared/errors/app-error.js';
import { toPublicUser } from '../../domain/entities/auth-user.entity.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import { prismaUserRepository } from '../../infrastructure/prisma/prisma-user.repository.js';
import { tokenIssuerService } from '../services/token-issuer.service.js';

type LoginWithPasswordInput = {
  email: string;
  password: string;
};

export const createLoginWithPasswordUseCase = (
  dependencies: {
    userRepository: UserRepository;
  } = {
    userRepository: prismaUserRepository,
  },
) => ({
  async execute(input: LoginWithPasswordInput) {
    const user = await dependencies.userRepository.findActiveByEmail(input.email.toLowerCase());

    if (!user) {
      throw domainError('AUTH_ACCOUNT_NOT_FOUND');
    }

    if (!user.passwordHash) {
      throw domainError('AUTH_INVALID_PASSWORD');
    }

    const validPassword = await argon2.verify(user.passwordHash, input.password);
    if (!validPassword) {
      throw domainError('AUTH_INVALID_PASSWORD');
    }

    if (!user.emailVerified) {
      throw domainError('AUTH_EMAIL_NOT_VERIFIED');
    }

    const tokens = await tokenIssuerService.issue(user);

    return {
      user: toPublicUser(user),
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  },
});

export const loginWithPasswordUseCase = createLoginWithPasswordUseCase();
