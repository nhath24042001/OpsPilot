import crypto from 'node:crypto';
import { type PrismaClient } from '@prisma/client';
import { signAccessToken, signRefreshToken } from '../../../../shared/auth/jwt.js';
import { hashOpaqueToken } from '../../../../shared/crypto/token.js';
import { prisma } from '../../../../shared/database/prisma.js';
import type { AuthUser } from '../../domain/entities/auth-user.entity.js';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

const refreshTokenExpiresAt = () => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
};

export const tokenIssuerService = {
  async issue(
    user: AuthUser,
    tx: TransactionClient = prisma,
    familyId: string = crypto.randomUUID(),
  ) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ ...payload, jti: crypto.randomUUID() });

    const storedRefreshToken = await tx.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashOpaqueToken(refreshToken),
        familyId,
        expiresAt: refreshTokenExpiresAt(),
      },
    });

    return { accessToken, refreshToken, storedRefreshToken };
  },
};
