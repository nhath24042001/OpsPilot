import { prisma } from '../../../../shared/database/prisma.js';
import { addMinutes, createOpaqueToken, hashOpaqueToken } from '../../../../shared/crypto/token.js';
import { domainError } from '../../../../shared/errors/app-error.js';
import type {
  AuthTokenRepository,
  ConsumeAuthTokenInput,
  CreateAuthTokenInput,
  AuthTokenPurpose,
} from '../../domain/repositories/auth-token.repository.js';
import type { AuthUser } from '../../domain/entities/auth-user.entity.js';
import type { Prisma } from '@prisma/client';

const purposeError = (purpose: AuthTokenPurpose) =>
  purpose === 'EMAIL_VERIFICATION'
    ? domainError('AUTH_INVALID_EMAIL_VERIFICATION_TOKEN')
    : domainError('AUTH_INVALID_PASSWORD_RESET_TOKEN');

export const prismaAuthTokenRepository: AuthTokenRepository = {
  async createAndInvalidatePrevious(input: CreateAuthTokenInput) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.authToken.updateMany({
        where: {
          userId: input.userId,
          purpose: input.purpose,
          consumedAt: null,
        },
        data: { consumedAt: new Date() },
      });

      const token = createOpaqueToken();

      await tx.authToken.create({
        data: {
          userId: input.userId,
          purpose: input.purpose,
          tokenHash: hashOpaqueToken(token),
          expiresAt: addMinutes(input.ttlMinutes),
        },
      });

      return token;
    });
  },

  async consume(input: ConsumeAuthTokenInput): Promise<AuthUser> {
    const stored = await prisma.authToken.findUnique({
      where: { tokenHash: hashOpaqueToken(input.token) },
      include: { user: true },
    });

    if (
      !stored ||
      stored.purpose !== input.purpose ||
      stored.consumedAt ||
      stored.expiresAt < new Date() ||
      stored.user.deletedAt
    ) {
      throw purposeError(input.purpose);
    }

    const [, user] = await prisma.$transaction([
      prisma.authToken.update({
        where: { id: stored.id },
        data: { consumedAt: new Date() },
      }),
      input.purpose === 'EMAIL_VERIFICATION'
        ? prisma.user.update({
            where: { id: stored.user.id },
            data: { emailVerified: true },
          })
        : prisma.user.findUniqueOrThrow({ where: { id: stored.user.id } }),
    ]);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl,
      passwordHash: user.passwordHash,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      deletedAt: user.deletedAt,
    };
  },
};
