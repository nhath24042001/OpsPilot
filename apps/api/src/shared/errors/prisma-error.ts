import { Prisma } from '@prisma/client';
import { domainError } from './app-error.js';

export const mapPrismaError = (error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return domainError('DATABASE_UNIQUE_CONSTRAINT', {
      target: error.meta?.target,
    });
  }

  return null;
};
