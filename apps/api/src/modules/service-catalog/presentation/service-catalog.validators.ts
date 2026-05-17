import { z } from 'zod';

const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.string().optional(),
});

export const createServiceSchema = z.object({
  params: z.object({ orgId: z.string().uuid() }),
  body: z.object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000).optional().nullable(),
    ownerMemberId: z.string().uuid().optional().nullable(),
  }),
});

export const listServicesSchema = z.object({
  params: z.object({ orgId: z.string().uuid() }),
  query: paginationQuerySchema,
});

export const updateServiceSchema = z.object({
  params: z.object({
    orgId: z.string().uuid(),
    serviceId: z.string().uuid(),
  }),
  body: z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      description: z.string().trim().max(1000).optional().nullable(),
      ownerMemberId: z.string().uuid().optional().nullable(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field is required',
    }),
});

export const deleteServiceSchema = z.object({
  params: z.object({
    orgId: z.string().uuid(),
    serviceId: z.string().uuid(),
  }),
});
