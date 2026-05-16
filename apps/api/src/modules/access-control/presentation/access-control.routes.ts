import { Router } from 'express';
import { authenticate } from '../../../shared/auth/authenticate.js';
import { asyncHandler } from '../../../shared/http/async-handler.js';
import { accessControlController } from './access-control.controller.js';
import { authorize, resolveTenant } from './tenant-middleware.js';

export const accessControlRoutes = Router();

accessControlRoutes.patch(
  '/orgs/:orgId/roles/:roleId/permissions',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('role:manage'),
  asyncHandler(accessControlController.updateRolePermissions.bind(accessControlController)),
);

accessControlRoutes.put(
  '/orgs/:orgId/members/:memberId/roles',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('role:manage'),
  asyncHandler(accessControlController.assignMemberRoles.bind(accessControlController)),
);
