import type { Request } from 'express';
import { domainError } from '../../../shared/errors/app-error.js';

export const getTenantContext = (req: Request) => {
  if (!req.orgContext) {
    throw domainError('ORGANIZATION_NOT_FOUND');
  }

  return req.orgContext;
};
