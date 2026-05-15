import { errorCatalog, type ErrorCode } from './error-catalog.js';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export const domainError = (code: ErrorCode, details?: unknown) => {
  const definition = errorCatalog[code];
  return new AppError(definition.statusCode, code, definition.message, details);
};

export const unauthorized = () => domainError('AUTH_UNAUTHORIZED');
