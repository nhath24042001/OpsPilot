import { prisma } from '../../../../shared/database/prisma.js';
import type {
  CreatePasswordUserInput,
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
};
