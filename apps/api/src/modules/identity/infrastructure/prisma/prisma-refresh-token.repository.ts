import { prisma } from '../../../../shared/database/prisma.js';
import type {
  CreateRefreshTokenInput,
  RefreshTokenRepository,
} from '../../domain/repositories/refresh-token.repository.js';

export const prismaRefreshTokenRepository: RefreshTokenRepository = {
  async create(input: CreateRefreshTokenInput) {
    return prisma.refreshToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        familyId: input.familyId,
        expiresAt: input.expiresAt,
      },
      include: { user: true },
    });
  },

  async findByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  },

  async revoke(tokenId: string, replacedByTokenId: string) {
    await prisma.refreshToken.update({
      where: { id: tokenId },
      data: {
        revokedAt: new Date(),
        replacedByTokenId,
      },
    });
  },

  async revokeFamily(familyId: string) {
    await prisma.refreshToken.updateMany({
      where: {
        familyId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  },

  async revokeAllForUser(userId: string) {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  },
};
