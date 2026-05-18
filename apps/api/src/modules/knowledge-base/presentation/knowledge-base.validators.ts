import { z } from 'zod';

const documentStatusSchema = z.enum([
  'PENDING_UPLOAD',
  'PENDING_INDEX',
  'INDEXING',
  'INDEXED',
  'INDEX_FAILED',
]);

const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.string().optional(),
});

export const requestKnowledgeUploadUrlSchema = z.object({
  params: z.object({ orgId: z.string().uuid() }),
  body: z.object({
    filename: z.string().trim().min(1).max(255),
    contentType: z.string().trim().min(1).max(120),
    byteSize: z.coerce.number().int().positive().max(25 * 1024 * 1024),
  }),
});

export const confirmKnowledgeUploadSchema = z.object({
  params: z.object({ orgId: z.string().uuid() }),
  body: z.object({
    fileId: z.string().uuid(),
    title: z.string().trim().min(1).max(180),
  }),
});

export const listKnowledgeDocumentsSchema = z.object({
  params: z.object({ orgId: z.string().uuid() }),
  query: paginationQuerySchema.extend({
    status: documentStatusSchema.optional(),
  }),
});

export const knowledgeDocumentParamsSchema = z.object({
  params: z.object({
    orgId: z.string().uuid(),
    documentId: z.string().uuid(),
  }),
});
