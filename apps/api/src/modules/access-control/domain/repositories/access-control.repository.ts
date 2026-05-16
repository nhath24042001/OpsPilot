import type { TenantAccess } from '../entities/tenant-access.entity.js';
import type { Permission } from '../value-objects/permission.vo.js';

export type UpdateRolePermissionsInput = {
  organizationId: string;
  roleId: string;
  permissions: readonly Permission[];
};

export type AssignMemberRolesInput = {
  organizationId: string;
  memberId: string;
  roleIds: readonly string[];
};

export interface AccessControlRepository {
  findTenantAccess(input: {
    organizationId: string;
    userId: string;
  }): Promise<TenantAccess | null>;

  findMemberUserId(input: { organizationId: string; memberId: string }): Promise<string | null>;

  updateRolePermissions(input: UpdateRolePermissionsInput): Promise<string[]>;

  assignMemberRoles(input: AssignMemberRolesInput): Promise<string>;
}
