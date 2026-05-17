import { Router } from 'express';
import { authenticate } from '../../../shared/auth/authenticate.js';
import { asyncHandler } from '../../../shared/http/async-handler.js';
import { authorize, resolveTenant } from '../../access-control/presentation/tenant-middleware.js';
import { incidentController } from './incident.controller.js';

export const incidentRoutes = Router();

incidentRoutes.post(
  '/orgs/:orgId/incidents',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('incident:create'),
  asyncHandler(incidentController.create.bind(incidentController)),
);

incidentRoutes.get(
  '/orgs/:orgId/incidents',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('incident:read'),
  asyncHandler(incidentController.list.bind(incidentController)),
);

incidentRoutes.get(
  '/orgs/:orgId/incidents/:incidentId',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('incident:read'),
  asyncHandler(incidentController.get.bind(incidentController)),
);

incidentRoutes.patch(
  '/orgs/:orgId/incidents/:incidentId/acknowledge',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('incident:update'),
  asyncHandler(incidentController.acknowledge.bind(incidentController)),
);

incidentRoutes.patch(
  '/orgs/:orgId/incidents/:incidentId/assign',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('incident:assign'),
  asyncHandler(incidentController.assign.bind(incidentController)),
);

incidentRoutes.patch(
  '/orgs/:orgId/incidents/:incidentId/resolve',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('incident:resolve'),
  asyncHandler(incidentController.resolve.bind(incidentController)),
);

incidentRoutes.patch(
  '/orgs/:orgId/incidents/:incidentId/cancel',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('incident:update'),
  asyncHandler(incidentController.cancel.bind(incidentController)),
);
