import { Router } from 'express';
import { authenticate } from '../../../shared/auth/authenticate.js';
import { asyncHandler } from '../../../shared/http/async-handler.js';
import { authorize, resolveTenant } from '../../access-control/presentation/tenant-middleware.js';
import { incidentTimelineController } from './incident-timeline.controller.js';

export const incidentTimelineRoutes = Router();

incidentTimelineRoutes.get(
  '/orgs/:orgId/incidents/:incidentId/timeline',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('incident:read'),
  asyncHandler(incidentTimelineController.list.bind(incidentTimelineController)),
);

incidentTimelineRoutes.post(
  '/orgs/:orgId/incidents/:incidentId/comments',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('incident:update'),
  asyncHandler(incidentTimelineController.addComment.bind(incidentTimelineController)),
);
