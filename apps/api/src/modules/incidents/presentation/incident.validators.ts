import { z } from 'zod';

const incidentStatusSchema = z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELED']);
const incidentSeveritySchema = z.enum(['SEV1', 'SEV2', 'SEV3', 'SEV4']);

const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.string().optional(),
});

export const createIncidentSchema = z.object({
  params: z.object({ orgId: z.string().uuid() }),
  body: z.object({
    serviceId: z.string().uuid().optional().nullable(),
    commanderMemberId: z.string().uuid().optional().nullable(),
    assignedMemberId: z.string().uuid().optional().nullable(),
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().max(4000).optional().nullable(),
    severity: incidentSeveritySchema,
  }),
});

export const listIncidentsSchema = z.object({
  params: z.object({ orgId: z.string().uuid() }),
  query: paginationQuerySchema.extend({
    status: incidentStatusSchema.optional(),
    severity: incidentSeveritySchema.optional(),
    serviceId: z.string().uuid().optional(),
  }),
});

export const incidentParamsSchema = z.object({
  params: z.object({
    orgId: z.string().uuid(),
    incidentId: z.string().uuid(),
  }),
});

export const assignIncidentSchema = z.object({
  params: incidentParamsSchema.shape.params,
  body: z.object({
    assignedMemberId: z.string().uuid(),
  }),
});

export const resolveIncidentSchema = z.object({
  params: incidentParamsSchema.shape.params,
  body: z.object({
    rootCause: z.string().trim().min(1).max(4000),
    resolution: z.string().trim().min(1).max(4000),
  }),
});
