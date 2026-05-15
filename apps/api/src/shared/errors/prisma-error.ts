import { Prisma } from '@prisma/client';
import { domainError } from './app-error.js';

export const mapPrismaError = (error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return domainError('DATABASE_UNIQUE_CONSTRAINT', {
      target: error.meta?.target,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
    return domainError('DATABASE_INVALID_QUERY', {
      message: error.message,
    });
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return domainError('DATABASE_INVALID_QUERY');
  }

  return null;
};
