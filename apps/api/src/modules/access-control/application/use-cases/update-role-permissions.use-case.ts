import type { PermissionCachePort } from '../ports/permission-cache.port.js';
import type { AccessControlRepository } from '../../domain/repositories/access-control.repository.js';
import { assertPermissions } from '../../domain/value-objects/permission.vo.js';

type UpdateRolePermissionsDeps = {
  accessControlRepository: AccessControlRepository;
  permissionCache: PermissionCachePort;
};

type UpdateRolePermissionsInput = {
  organizationId: string;
  roleId: string;
  permissions: readonly string[];
};

export const createUpdateRolePermissionsUseCase = (deps: UpdateRolePermissionsDeps) => ({
  async execute(input: UpdateRolePermissionsInput) {
    const permissions = assertPermissions(input.permissions);
    const affectedUserIds = await deps.accessControlRepository.updateRolePermissions({
      organizationId: input.organizationId,
      roleId: input.roleId,
      permissions,
    });

    await Promise.all(
      affectedUserIds.map((userId) =>
        deps.permissionCache.invalidate({
          organizationId: input.organizationId,
          userId,
        }),
      ),
    );

    return {
      roleId: input.roleId,
      permissions,
      invalidatedUsers: affectedUserIds.length,
    };
  },
});
