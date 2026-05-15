import argon2 from 'argon2';
import { verifyRefreshToken } from '../../../shared/auth/jwt.js';
import { env } from '../../../shared/config/env.js';
import { hashOpaqueToken } from '../../../shared/crypto/token.js';
import { prisma } from '../../../shared/database/prisma.js';
import { emailService } from '../../../shared/email/email.service.js';
import { domainError, unauthorized } from '../../../shared/errors/app-error.js';
import { toPublicUser } from '../domain/entities/auth-user.entity.js';
import { prismaUserRepository } from '../infrastructure/prisma/prisma-user.repository.js';
import { authTokenService } from './auth-token.service.js';
import { tokenIssuerService } from './services/token-issuer.service.js';
import {
  loginWithOAuthUseCase,
  type OAuthProviderName,
} from './use-cases/login-with-oauth.use-case.js';
import { loginWithPasswordUseCase } from './use-cases/login-with-password.use-case.js';

const publicAuthMessage = {
  message: 'If the email is eligible, instructions will be sent shortly.',
};

export const authService = {
  async register(input: { email: string; password: string; name?: string }) {
    const email = input.email.toLowerCase();
    const passwordHash = await argon2.hash(input.password);

    const { user, verificationToken } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, passwordHash, name: input.name, emailVerified: false },
      });

      const verificationToken = await authTokenService.create(tx, {
        userId: user.id,
        purpose: 'EMAIL_VERIFICATION',
        ttlMinutes: env.EMAIL_VERIFICATION_TTL_MINUTES,
      });

      return { user, verificationToken };
    });

    await emailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      token: verificationToken,
    });

    return {
      user: toPublicUser(user),
      emailVerificationSent: true,
    };
  },

  async login(input: { email: string; password: string }) {
    return loginWithPasswordUseCase.execute(input);
  },

  async verifyEmail(token: string) {
    const user = await prisma.$transaction(async (tx) => {
      const user = await authTokenService.consume(tx, {
        token,
        purpose: 'EMAIL_VERIFICATION',
      });

      return tx.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    });

    return { user: toPublicUser(user), emailVerified: true };
  },

  async resendVerificationEmail(input: { email: string }) {
    const user = await prismaUserRepository.findActiveByEmail(input.email.toLowerCase());

    if (!user || user.emailVerified) {
      return publicAuthMessage;
    }

    const verificationToken = await prisma.$transaction((tx) =>
      authTokenService.create(tx, {
        userId: user.id,
        purpose: 'EMAIL_VERIFICATION',
        ttlMinutes: env.EMAIL_VERIFICATION_TTL_MINUTES,
      }),
    );

    await emailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      token: verificationToken,
    });

    return publicAuthMessage;
  },

  async forgotPassword(input: { email: string }) {
    const user = await prismaUserRepository.findActiveByEmail(input.email.toLowerCase());

    if (!user?.passwordHash) {
      return publicAuthMessage;
    }

    const resetToken = await prisma.$transaction((tx) =>
      authTokenService.create(tx, {
        userId: user.id,
        purpose: 'PASSWORD_RESET',
        ttlMinutes: env.PASSWORD_RESET_TTL_MINUTES,
      }),
    );

    await emailService.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token: resetToken,
    });

    return publicAuthMessage;
  },

  async resetPassword(input: { token: string; password: string }) {
    const passwordHash = await argon2.hash(input.password);

    await prisma.$transaction(async (tx) => {
      const user = await authTokenService.consume(tx, {
        token: input.token,
        purpose: 'PASSWORD_RESET',
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          emailVerified: true,
        },
      });

      await tx.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    return { passwordReset: true };
  },

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw domainError('AUTH_INVALID_REFRESH_TOKEN');
    }

    return prisma.$transaction(async (tx) => {
      const stored = await tx.refreshToken.findUnique({
        where: { tokenHash: hashOpaqueToken(refreshToken) },
        include: { user: true },
      });

      if (
        !stored ||
        stored.expiresAt < new Date() ||
        stored.userId !== payload.sub ||
        stored.user.deletedAt
      ) {
        throw domainError('AUTH_INVALID_REFRESH_TOKEN');
      }

      if (stored.revokedAt) {
        await tx.refreshToken.updateMany({
          where: {
            userId: stored.userId,
            familyId: stored.familyId,
            revokedAt: null,
          },
          data: { revokedAt: new Date() },
        });

        throw domainError('AUTH_REFRESH_TOKEN_REUSE_DETECTED');
      }

      const tokens = await tokenIssuerService.issue(stored.user, tx, stored.familyId);

      await tx.refreshToken.update({
        where: { id: stored.id },
        data: {
          revokedAt: new Date(),
          rotatedAt: new Date(),
          replacedByTokenId: tokens.storedRefreshToken.id,
        },
      });

      return {
        user: toPublicUser(stored.user),
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      };
    });
  },

  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw domainError('AUTH_REFRESH_TOKEN_REQUIRED');
    }

    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashOpaqueToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async me(userId: string) {
    const user = await prismaUserRepository.findActiveById(userId);
    if (!user) {
      throw unauthorized();
    }
    return toPublicUser(user);
  },

  getOAuthAuthorizationUrl(provider: OAuthProviderName) {
    return loginWithOAuthUseCase.getAuthorizationUrl(provider);
  },

  async handleOAuthCallback(input: { provider: OAuthProviderName; code: string; state: string }) {
    return loginWithOAuthUseCase.execute(input);
  },
};
