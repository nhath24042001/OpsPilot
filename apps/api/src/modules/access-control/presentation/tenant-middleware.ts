/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { getAuthContext } from '../../../shared/auth/auth-context.js';
import { domainError } from '../../../shared/errors/app-error.js';
import { accessControlModule } from '../access-control.module.js';
import type { Permission } from '../domain/value-objects/permission.vo.js';

const organizationParamsSchema = z.object({
  orgId: z.string().uuid(),
});

export const resolveTenant = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const auth = getAuthContext(req);
    const params = organizationParamsSchema.parse(req.params);
    const access = await accessControlModule.permissionService.resolveTenantAccess({
      organizationId: params.orgId,
      userId: auth.userId,
    });

    req.orgContext = {
      organizationId: access.organizationId,
      memberId: access.memberId,
      permissions: access.permissions,
    };

    next();
  } catch (err) {
    next(err);
  }
};

export const authorize =
  (permission: Permission) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.orgContext) {
      next(domainError('ORGANIZATION_NOT_FOUND'));
      return;
    }

    if (!req.orgContext.permissions.includes(permission)) {
      next(
        domainError('RBAC_FORBIDDEN', {
          organizationId: req.orgContext.organizationId,
          permission,
        }),
      );
      return;
    }

    next();
  };
