import type { Permission } from '../value-objects/permission.vo.js';

export type TenantAccess = {
  organizationId: string;
  memberId: string;
  userId: string;
  permissions: Permission[];
};
