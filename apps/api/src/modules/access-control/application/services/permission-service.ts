import { domainError } from '../../../../shared/errors/app-error.js';
import type { PermissionCachePort } from '../ports/permission-cache.port.js';
import type { AccessControlRepository } from '../../domain/repositories/access-control.repository.js';
import type { TenantAccess } from '../../domain/entities/tenant-access.entity.js';
import type { Permission } from '../../domain/value-objects/permission.vo.js';

const PERMISSION_CACHE_TTL_SECONDS = 5 * 60;

export type PermissionService = ReturnType<typeof createPermissionService>;

type PermissionServiceDeps = {
  accessControlRepository: AccessControlRepository;
  permissionCache: PermissionCachePort;
};

export const createPermissionService = (deps: PermissionServiceDeps) => {
  const resolveTenantAccess = async (input: {
    organizationId: string;
    userId: string;
  }): Promise<TenantAccess> => {
    const cached = await deps.permissionCache.get(input);
    if (cached) {
      return {
        organizationId: input.organizationId,
        userId: input.userId,
        memberId: cached.memberId,
        permissions: cached.permissions,
      };
    }

    const access = await deps.accessControlRepository.findTenantAccess(input);
    if (!access) {
      throw domainError('ORGANIZATION_NOT_FOUND');
    }

    await deps.permissionCache.set({
      organizationId: input.organizationId,
      userId: input.userId,
      value: {
        memberId: access.memberId,
        permissions: access.permissions,
      },
      ttlSeconds: PERMISSION_CACHE_TTL_SECONDS,
    });

    return access;
  };

  const ensurePermission = async (input: {
    organizationId: string;
    userId: string;
    permission: Permission;
  }): Promise<TenantAccess> => {
    const access = await resolveTenantAccess({
      organizationId: input.organizationId,
      userId: input.userId,
    });

    if (!access.permissions.includes(input.permission)) {
      throw domainError('RBAC_FORBIDDEN', {
        organizationId: input.organizationId,
        permission: input.permission,
      });
    }

    return access;
  };

  const invalidate = async (input: { organizationId: string; userId: string }): Promise<void> => {
    await deps.permissionCache.invalidate(input);
  };

  return {
    resolveTenantAccess,
    ensurePermission,
    invalidate,
  };
};
