import { Prisma } from '@prisma/client';
import { domainError } from './app-error.js';

export const mapPrismaError = (error: unknown) => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    if (error instanceof Prisma.PrismaClientValidationError) {
      return domainError('DATABASE_INVALID_QUERY');
    }
    return null;
  }

  switch (error.code) {
    case 'P2002':
      return domainError('DATABASE_UNIQUE_CONSTRAINT', { target: error.meta?.['target'] });

    case 'P2003':
      return domainError('DATABASE_INVALID_QUERY', { field: error.meta?.['field_name'] });

    case 'P2023':
      return domainError('DATABASE_INVALID_QUERY', { message: error.message });

    case 'P2025':
      return domainError('RESOURCE_NOT_FOUND');

    default:
      return null;
  }
};

