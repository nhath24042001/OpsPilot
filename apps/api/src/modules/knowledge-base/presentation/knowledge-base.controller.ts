import type { Request, Response } from 'express';
import { getTenantContext } from '../../access-control/presentation/tenant-context.js';
import { knowledgeBaseModule } from '../knowledge-base.module.js';
import {
  confirmKnowledgeUploadSchema,
  knowledgeDocumentParamsSchema,
  listKnowledgeDocumentsSchema,
  requestKnowledgeUploadUrlSchema,
} from './knowledge-base.validators.js';

export const knowledgeBaseController = {
  async requestUploadUrl(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { body } = requestKnowledgeUploadUrlSchema.parse(req);
    const result = await knowledgeBaseModule.knowledgeBaseService.requestUploadUrl({
      organizationId: tenant.organizationId,
      createdByMemberId: tenant.memberId,
      filename: body.filename,
      contentType: body.contentType,
      byteSize: body.byteSize,
    });

    res.status(201).json(result);
  },

  async confirmUpload(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { body } = confirmKnowledgeUploadSchema.parse(req);
    const result = await knowledgeBaseModule.knowledgeBaseService.confirmUpload({
      organizationId: tenant.organizationId,
      createdByMemberId: tenant.memberId,
      fileId: body.fileId,
      title: body.title,
    });

    res.status(201).json(result);
  },

  async list(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { query } = listKnowledgeDocumentsSchema.parse(req);
    const page = await knowledgeBaseModule.knowledgeBaseService.listDocuments({
      organizationId: tenant.organizationId,
      limit: query.limit,
      cursor: query.cursor,
      status: query.status,
    });

    res.status(200).json({ documents: page.items, pageInfo: page.pageInfo });
  },

  async get(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { params } = knowledgeDocumentParamsSchema.parse(req);
    const result = await knowledgeBaseModule.knowledgeBaseService.getDocument({
      organizationId: tenant.organizationId,
      documentId: params.documentId,
    });

    res.status(200).json(result);
  },

  async downloadUrl(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { params } = knowledgeDocumentParamsSchema.parse(req);
    const result = await knowledgeBaseModule.knowledgeBaseService.getDocumentDownloadUrl({
      organizationId: tenant.organizationId,
      documentId: params.documentId,
    });

    res.status(200).json(result);
  },

  async reindex(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { params } = knowledgeDocumentParamsSchema.parse(req);
    const result = await knowledgeBaseModule.knowledgeBaseService.reindexDocument({
      organizationId: tenant.organizationId,
      documentId: params.documentId,
    });

    res.status(202).json(result);
  },
};
