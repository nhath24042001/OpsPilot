export const errorCatalog = {
  VALIDATION_FAILED: {
    statusCode: 400,
    message: 'Invalid request payload',
  },
  DATABASE_UNIQUE_CONSTRAINT: {
    statusCode: 409,
    message: 'Resource already exists',
  },
  DATABASE_INVALID_QUERY: {
    statusCode: 400,
    message: 'Invalid database query input',
  },
  AUTH_UNAUTHORIZED: {
    statusCode: 401,
    message: 'Unauthorized',
  },
  AUTH_ACCOUNT_NOT_FOUND: {
    statusCode: 404,
    message: 'Account not found',
  },
  AUTH_INVALID_PASSWORD: {
    statusCode: 401,
    message: 'Invalid password',
  },
  AUTH_EMAIL_NOT_VERIFIED: {
    statusCode: 403,
    message: 'Email verification is required',
  },
  AUTH_INVALID_EMAIL_VERIFICATION_TOKEN: {
    statusCode: 400,
    message: 'Invalid or expired email verification token',
  },
  AUTH_INVALID_PASSWORD_RESET_TOKEN: {
    statusCode: 400,
    message: 'Invalid or expired password reset token',
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
  AUTH_OAUTH_PROVIDER_UNSUPPORTED: {
    statusCode: 400,
    message: 'Unsupported OAuth provider',
  },
  AUTH_OAUTH_PROVIDER_NOT_CONFIGURED: {
    statusCode: 501,
    message: 'OAuth provider is not configured',
  },
  AUTH_OAUTH_CALLBACK_FAILED: {
    statusCode: 401,
    message: 'OAuth callback failed',
  },
  AUTH_OAUTH_INVALID_STATE: {
    statusCode: 401,
    message: 'Invalid OAuth state',
  },
  ORGANIZATION_NOT_FOUND: {
    statusCode: 404,
    message: 'Organization not found',
  },
  ORGANIZATION_MEMBER_NOT_FOUND: {
    statusCode: 404,
    message: 'Organization member not found',
  },
  SERVICE_NOT_FOUND: {
    statusCode: 404,
    message: 'Service not found',
  },
  INCIDENT_NOT_FOUND: {
    statusCode: 404,
    message: 'Incident not found',
  },
  INCIDENT_INVALID_TRANSITION: {
    statusCode: 409,
    message: 'Invalid incident state transition',
  },
  RBAC_FORBIDDEN: {
    statusCode: 403,
    message: 'Permission denied',
  },
  RATE_LIMIT_EXCEEDED: {
    statusCode: 429,
    message: 'Rate limit exceeded',
  },
  RESOURCE_NOT_FOUND: {
    statusCode: 404,
    message: 'Resource not found',
  },
  INTERNAL_SERVER_ERROR: {
    statusCode: 500,
    message: 'Internal server error',
  },
} as const;

export type ErrorCode = keyof typeof errorCatalog;
