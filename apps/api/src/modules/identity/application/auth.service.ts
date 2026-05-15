import argon2 from 'argon2';
import crypto from 'node:crypto';
import { type PrismaClient, type User } from '@prisma/client';
import { prisma } from '../../../shared/database/prisma.js';
import { domainError, unauthorized } from '../../../shared/errors/app-error.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../../shared/auth/jwt.js';

const refreshTokenExpiresAt = () => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
};

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

const sanitizeUser = (user: User) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  imageUrl: user.imageUrl,
  emailVerified: user.emailVerified,
  createdAt: user.createdAt,
});

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

const issueTokens = async (
  user: User,
  tx: TransactionClient = prisma,
  familyId: string = crypto.randomUUID(),
) => {
  const payload = { sub: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ ...payload, jti: crypto.randomUUID() });

  const storedRefreshToken = await tx.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      familyId,
      expiresAt: refreshTokenExpiresAt(),
    },
  });

  return { accessToken, refreshToken, storedRefreshToken };
};

export const authService = {
  async register(input: { email: string; password: string; name?: string }) {
    const passwordHash = await argon2.hash(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        name: input.name,
      },
    });

    const tokens = await issueTokens(user);
    return {
      user: sanitizeUser(user),
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  },

  async login(input: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase(), deletedAt: null },
    });

    if (!user?.passwordHash) {
      throw domainError('AUTH_INVALID_CREDENTIALS');
    }

    const validPassword = await argon2.verify(user.passwordHash, input.password);
    if (!validPassword) {
      throw domainError('AUTH_INVALID_CREDENTIALS');
    }

    const tokens = await issueTokens(user);
    return {
      user: sanitizeUser(user),
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
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
        where: { tokenHash: hashToken(refreshToken) },
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

      const tokens = await issueTokens(stored.user, tx, stored.familyId);

      await tx.refreshToken.update({
        where: { id: stored.id },
        data: {
          revokedAt: new Date(),
          rotatedAt: new Date(),
          replacedByTokenId: tokens.storedRefreshToken.id,
        },
      });

      return {
        user: sanitizeUser(stored.user),
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
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId, deletedAt: null } });
    if (!user) {
      throw unauthorized();
    }
    return sanitizeUser(user);
  },
};
