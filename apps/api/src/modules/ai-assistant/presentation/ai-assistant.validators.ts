import { z } from 'zod';

const topKSchema = z.coerce.number().int().positive().max(10).optional();

export const askKnowledgeBaseSchema = z.object({
  params: z.object({ orgId: z.string().uuid() }),
  body: z.object({
    question: z.string().trim().min(3).max(2000),
    topK: topKSchema,
  }),
});

export const incidentAssistantParamsSchema = z.object({
  params: z.object({
    orgId: z.string().uuid(),
    incidentId: z.string().uuid(),
  }),
});

export const recommendRunbooksSchema = z.object({
  params: incidentAssistantParamsSchema.shape.params,
  body: z
    .object({
      topK: topKSchema,
    })
    .optional()
    .default({}),
});
