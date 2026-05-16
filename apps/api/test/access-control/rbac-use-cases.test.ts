import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAssignMemberRolesUseCase } from '../../src/modules/access-control/application/use-cases/assign-member-roles.use-case.js';
import { createUpdateRolePermissionsUseCase } from '../../src/modules/access-control/application/use-cases/update-role-permissions.use-case.js';
import type { PermissionCachePort } from '../../src/modules/access-control/application/ports/permission-cache.port.js';
import type { AccessControlRepository } from '../../src/modules/access-control/domain/repositories/access-control.repository.js';

describe('rbac use cases', () => {
  const updateRolePermissions = vi.fn<AccessControlRepository['updateRolePermissions']>();
  const assignMemberRoles = vi.fn<AccessControlRepository['assignMemberRoles']>();
  const invalidate = vi.fn<PermissionCachePort['invalidate']>();

  const repository = {
    updateRolePermissions,
    assignMemberRoles,
  } as unknown as AccessControlRepository;

  const cache = {
    invalidate,
  } as unknown as PermissionCachePort;

  const organizationId = '11111111-1111-1111-1111-111111111111';
  const roleId = '22222222-2222-2222-2222-222222222222';
  const memberId = '33333333-3333-3333-3333-333333333333';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates role permissions and invalidates affected member permission caches', async () => {
    updateRolePermissions.mockResolvedValueOnce([
      '44444444-4444-4444-4444-444444444444',
      '55555555-5555-5555-5555-555555555555',
    ]);

    const useCase = createUpdateRolePermissionsUseCase({
      accessControlRepository: repository,
      permissionCache: cache,
    });

    const result = await useCase.execute({
      organizationId,
      roleId,
      permissions: ['organization:read', 'role:manage', 'role:manage'],
    });

    expect(updateRolePermissions).toHaveBeenCalledWith({
      organizationId,
      roleId,
      permissions: ['organization:read', 'role:manage'],
    });
    expect(invalidate).toHaveBeenCalledTimes(2);
    expect(invalidate).toHaveBeenCalledWith({
      organizationId,
      userId: '44444444-4444-4444-4444-444444444444',
    });
    expect(result).toEqual({
      roleId,
      permissions: ['organization:read', 'role:manage'],
      invalidatedUsers: 2,
    });
  });

  it('rejects unknown permissions before repository mutation', async () => {
    const useCase = createUpdateRolePermissionsUseCase({
      accessControlRepository: repository,
      permissionCache: cache,
    });

    await expect(
      useCase.execute({
        organizationId,
        roleId,
        permissions: ['organization:read', 'unknown:permission'],
      }),
    ).rejects.toThrow('Unknown permissions');

    expect(updateRolePermissions).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('assigns member roles and invalidates that member user cache', async () => {
    assignMemberRoles.mockResolvedValueOnce('44444444-4444-4444-4444-444444444444');

    const useCase = createAssignMemberRolesUseCase({
      accessControlRepository: repository,
      permissionCache: cache,
    });

    const result = await useCase.execute({
      organizationId,
      memberId,
      roleIds: [roleId, roleId],
    });

    expect(assignMemberRoles).toHaveBeenCalledWith({
      organizationId,
      memberId,
      roleIds: [roleId, roleId],
    });
    expect(invalidate).toHaveBeenCalledWith({
      organizationId,
      userId: '44444444-4444-4444-4444-444444444444',
    });
    expect(result).toEqual({
      memberId,
      roleIds: [roleId],
    });
  });

  it('requires at least one role assignment', async () => {
    const useCase = createAssignMemberRolesUseCase({
      accessControlRepository: repository,
      permissionCache: cache,
    });

    await expect(
      useCase.execute({
        organizationId,
        memberId,
        roleIds: [],
      }),
    ).rejects.toHaveProperty('code', 'VALIDATION_FAILED');

    expect(assignMemberRoles).not.toHaveBeenCalled();
  });
});
