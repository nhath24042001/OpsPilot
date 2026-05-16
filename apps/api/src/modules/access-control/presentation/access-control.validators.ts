import { z } from 'zod';
import { PERMISSIONS } from '../domain/value-objects/permission.vo.js';

export const updateRolePermissionsSchema = z.object({
  params: z.object({
    orgId: z.string().uuid(),
    roleId: z.string().uuid(),
  }),
  body: z.object({
    permissions: z.array(z.enum(PERMISSIONS)).min(1),
  }),
});

export const assignMemberRolesSchema = z.object({
  params: z.object({
    orgId: z.string().uuid(),
    memberId: z.string().uuid(),
  }),
  body: z.object({
    roleIds: z.array(z.string().uuid()).min(1),
  }),
});
