import { z } from 'zod';

const paramsSchema = z.object({
  orgId: z.string().uuid(),
  incidentId: z.string().uuid(),
});

export const listIncidentTimelineSchema = z.object({
  params: paramsSchema,
  query: z.object({
    limit: z.coerce.number().int().positive().max(100).optional(),
    cursor: z.string().optional(),
  }),
});

export const addIncidentCommentSchema = z.object({
  params: paramsSchema,
  body: z.object({
    body: z.string().trim().min(1).max(4000),
  }),
});
