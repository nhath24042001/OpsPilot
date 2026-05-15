export const errorCatalog = {
  VALIDATION_FAILED: {
    statusCode: 400,
    message: 'Invalid request payload',
  },
  DATABASE_UNIQUE_CONSTRAINT: {
    statusCode: 409,
    message: 'Resource already exists',
  },
  AUTH_UNAUTHORIZED: {
    statusCode: 401,
    message: 'Unauthorized',
  },
  AUTH_INVALID_CREDENTIALS: {
    statusCode: 401,
    message: 'Invalid credentials',
  },
  AUTH_INVALID_REFRESH_TOKEN: {
    statusCode: 401,
    message: 'Invalid refresh token',
  },
  AUTH_REFRESH_TOKEN_REUSE_DETECTED: {
    statusCode: 401,
    message: 'Refresh token reuse detected',
  },
  AUTH_REFRESH_TOKEN_REQUIRED: {
    statusCode: 400,
    message: 'refreshToken is required',
  },
  AUTH_CONTEXT_MISSING: {
    statusCode: 400,
    message: 'Missing auth context',
  },
  ORGANIZATION_NOT_FOUND: {
    statusCode: 404,
    message: 'Organization not found',
  },
  INTERNAL_SERVER_ERROR: {
    statusCode: 500,
    message: 'Internal server error',
  },
} as const;

export type ErrorCode = keyof typeof errorCatalog;
