import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, domainError } from '../errors/app-error.js';
import { errorCatalog } from '../errors/error-catalog.js';
import { mapPrismaError } from '../errors/prisma-error.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const validationError = domainError('VALIDATION_FAILED', err.flatten());
    res.status(400).json({
      error: {
        code: validationError.code,
        message: validationError.message,
        details: validationError.details,
      },
    });
    return;
  }

  const prismaError = mapPrismaError(err);
  if (prismaError) {
    res.status(prismaError.statusCode).json({
      error: {
        code: prismaError.code,
        message: prismaError.message,
        details: prismaError.details,
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: errorCatalog.INTERNAL_SERVER_ERROR.message,
    },
  });
};
