import { type AuthTokenPurpose, type PrismaClient, type User } from '@prisma/client';
import { addMinutes, createOpaqueToken, hashOpaqueToken } from '../../../shared/crypto/token.js';
import { domainError } from '../../../shared/errors/app-error.js';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

const purposeError = (purpose: AuthTokenPurpose) =>
  purpose === 'EMAIL_VERIFICATION'
    ? domainError('AUTH_INVALID_EMAIL_VERIFICATION_TOKEN')
    : domainError('AUTH_INVALID_PASSWORD_RESET_TOKEN');

export const authTokenService = {
  async create(
    tx: TransactionClient,
    input: { userId: string; purpose: AuthTokenPurpose; ttlMinutes: number },
  ) {
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
  },

  async consume(
    tx: TransactionClient,
    input: { token: string; purpose: AuthTokenPurpose },
  ): Promise<User> {
    const stored = await tx.authToken.findUnique({
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

    await tx.authToken.update({
      where: { id: stored.id },
      data: { consumedAt: new Date() },
    });

    return stored.user;
  },
};
