import { z } from 'zod';

export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
  }),
});

export const organizationParamsSchema = z.object({
  params: z.object({
    orgId: z.string().min(1),
  }),
});
