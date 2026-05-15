import type { Request } from 'express';
import { domainError } from '../errors/app-error.js';

export const getAuthContext = (req: Request) => {
  if (!req.auth) {
    throw domainError('AUTH_CONTEXT_MISSING');
  }

  return req.auth;
};
