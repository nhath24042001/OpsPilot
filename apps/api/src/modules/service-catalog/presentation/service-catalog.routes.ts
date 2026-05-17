import { Router } from 'express';
import { authenticate } from '../../../shared/auth/authenticate.js';
import { asyncHandler } from '../../../shared/http/async-handler.js';
import { authorize, resolveTenant } from '../../access-control/presentation/tenant-middleware.js';
import { serviceCatalogController } from './service-catalog.controller.js';

export const serviceCatalogRoutes = Router();

serviceCatalogRoutes.post(
  '/orgs/:orgId/services',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('service:create'),
  asyncHandler(serviceCatalogController.create.bind(serviceCatalogController)),
);

serviceCatalogRoutes.get(
  '/orgs/:orgId/services',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('service:read'),
  asyncHandler(serviceCatalogController.list.bind(serviceCatalogController)),
);

serviceCatalogRoutes.patch(
  '/orgs/:orgId/services/:serviceId',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('service:update'),
  asyncHandler(serviceCatalogController.update.bind(serviceCatalogController)),
);

serviceCatalogRoutes.delete(
  '/orgs/:orgId/services/:serviceId',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('service:delete'),
  asyncHandler(serviceCatalogController.delete.bind(serviceCatalogController)),
);
