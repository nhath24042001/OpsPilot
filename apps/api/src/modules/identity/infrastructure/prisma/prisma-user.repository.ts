import { prisma } from '../../../../shared/database/prisma.js';
import type {
  CreatePasswordUserInput,
  UpsertOAuthUserInput,
  UserRepository,
} from '../../domain/repositories/user.repository.js';

export const prismaUserRepository: UserRepository = {
  async createPasswordUser(input: CreatePasswordUserInput) {
    return prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
        emailVerified: false,
      },
    });
  },

  async findActiveByEmail(email: string) {
    return prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });
  },

  async findActiveById(id: string) {
    return prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  },

  async markEmailVerified(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
  },

  async updatePassword(userId: string, passwordHash: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        emailVerified: true,
      },
    });
  },

  async upsertFromOAuth(input: UpsertOAuthUserInput) {
    return prisma.user.upsert({
      where: { email: input.email },
      create: {
        email: input.email,
        name: input.name,
        imageUrl: input.imageUrl,
        emailVerified: input.emailVerified,
      },
      update: {
        name: input.name,
        imageUrl: input.imageUrl,
        emailVerified: input.emailVerified || undefined,
      },
    });
  },
};
