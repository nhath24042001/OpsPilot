import { Router } from 'express';
import { authenticate } from '../../../shared/auth/authenticate.js';
import { asyncHandler } from '../../../shared/http/async-handler.js';
import { organizationController } from './organization.controller.js';

export const organizationRoutes = Router();

organizationRoutes.post(
  '/organizations',
  authenticate,
  asyncHandler(organizationController.create.bind(organizationController)),
);

organizationRoutes.get(
  '/organizations',
  authenticate,
  asyncHandler(organizationController.list.bind(organizationController)),
);

organizationRoutes.get(
  '/orgs/:orgId',
  authenticate,
  asyncHandler(organizationController.get.bind(organizationController)),
);
