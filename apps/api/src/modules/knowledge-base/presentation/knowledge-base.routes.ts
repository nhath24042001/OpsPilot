import { Router } from 'express';
import { authenticate } from '../../../shared/auth/authenticate.js';
import { asyncHandler } from '../../../shared/http/async-handler.js';
import { authorize, resolveTenant } from '../../access-control/presentation/tenant-middleware.js';
import { knowledgeBaseController } from './knowledge-base.controller.js';

export const knowledgeBaseRoutes = Router();

knowledgeBaseRoutes.post(
  '/orgs/:orgId/knowledge-documents/upload-url',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('knowledge:create'),
  asyncHandler(knowledgeBaseController.requestUploadUrl.bind(knowledgeBaseController)),
);

knowledgeBaseRoutes.post(
  '/orgs/:orgId/knowledge-documents/confirm-upload',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('knowledge:create'),
  asyncHandler(knowledgeBaseController.confirmUpload.bind(knowledgeBaseController)),
);

knowledgeBaseRoutes.get(
  '/orgs/:orgId/knowledge-documents',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('knowledge:read'),
  asyncHandler(knowledgeBaseController.list.bind(knowledgeBaseController)),
);

knowledgeBaseRoutes.get(
  '/orgs/:orgId/knowledge-documents/:documentId',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('knowledge:read'),
  asyncHandler(knowledgeBaseController.get.bind(knowledgeBaseController)),
);

knowledgeBaseRoutes.get(
  '/orgs/:orgId/knowledge-documents/:documentId/download-url',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('knowledge:read'),
  asyncHandler(knowledgeBaseController.downloadUrl.bind(knowledgeBaseController)),
);

knowledgeBaseRoutes.post(
  '/orgs/:orgId/knowledge-documents/:documentId/reindex',
  authenticate,
  asyncHandler(resolveTenant),
  authorize('knowledge:index'),
  asyncHandler(knowledgeBaseController.reindex.bind(knowledgeBaseController)),
);
