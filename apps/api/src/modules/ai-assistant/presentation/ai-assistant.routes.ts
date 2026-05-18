import { Router } from 'express';
import { authenticate } from '../../../shared/auth/authenticate.js';
import { asyncHandler } from '../../../shared/http/async-handler.js';
import { authorize, resolveTenant } from '../../access-control/presentation/tenant-middleware.js';
import { aiAssistantController } from './ai-assistant.controller.js';

export const aiAssistantRoutes = Router();

aiAssistantRoutes.post(
  '/orgs/:orgId/assistant/ask',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('ai:ask'),
  asyncHandler(aiAssistantController.ask.bind(aiAssistantController)),
);

aiAssistantRoutes.post(
  '/orgs/:orgId/incidents/:incidentId/assistant/recommend-runbooks',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('ai:ask'),
  asyncHandler(aiAssistantController.recommendRunbooks.bind(aiAssistantController)),
);

aiAssistantRoutes.post(
  '/orgs/:orgId/incidents/:incidentId/postmortem/generate',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('ai:summarize'),
  asyncHandler(aiAssistantController.generatePostmortem.bind(aiAssistantController)),
);
