import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPermissionService } from '../../src/modules/access-control/application/services/permission-service.js';
import type { PermissionCachePort } from '../../src/modules/access-control/application/ports/permission-cache.port.js';
import type { TenantAccess } from '../../src/modules/access-control/domain/entities/tenant-access.entity.js';
import type { AccessControlRepository } from '../../src/modules/access-control/domain/repositories/access-control.repository.js';

describe('permissionService', () => {
  const findTenantAccess = vi.fn<AccessControlRepository['findTenantAccess']>();
  const cacheGet = vi.fn<PermissionCachePort['get']>();
  const cacheSet = vi.fn<PermissionCachePort['set']>();
  const cacheInvalidate = vi.fn<PermissionCachePort['invalidate']>();

  const repository = {
    findTenantAccess,
  } as unknown as AccessControlRepository;

  const cache = {
    get: cacheGet,
    set: cacheSet,
    invalidate: cacheInvalidate,
  } as unknown as PermissionCachePort;

  const service = createPermissionService({
    accessControlRepository: repository,
    permissionCache: cache,
  });

  const tenantAccess: TenantAccess = {
    organizationId: '11111111-1111-1111-1111-111111111111',
    memberId: '22222222-2222-2222-2222-222222222222',
    userId: '33333333-3333-3333-3333-333333333333',
    permissions: ['organization:read', 'role:manage'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns cached tenant permissions without hitting repository', async () => {
    cacheGet.mockResolvedValueOnce({
      memberId: tenantAccess.memberId,
      permissions: tenantAccess.permissions,
    });

    const result = await service.resolveTenantAccess({
      organizationId: tenantAccess.organizationId,
      userId: tenantAccess.userId,
    });

    expect(findTenantAccess).not.toHaveBeenCalled();
    expect(cacheSet).not.toHaveBeenCalled();
    expect(result).toEqual(tenantAccess);
  });

  it('loads tenant permissions from repository and caches them on miss', async () => {
    cacheGet.mockResolvedValueOnce(null);
    findTenantAccess.mockResolvedValueOnce(tenantAccess);

    const result = await service.resolveTenantAccess({
      organizationId: tenantAccess.organizationId,
      userId: tenantAccess.userId,
    });

    expect(result).toEqual(tenantAccess);
    expect(cacheSet).toHaveBeenCalledWith({
      organizationId: tenantAccess.organizationId,
      userId: tenantAccess.userId,
      value: {
        memberId: tenantAccess.memberId,
        permissions: tenantAccess.permissions,
      },
      ttlSeconds: 300,
    });
  });

  it('returns 404-style tenant error when user is not an active member', async () => {
    cacheGet.mockResolvedValueOnce(null);
    findTenantAccess.mockResolvedValueOnce(null);

    await expect(
      service.resolveTenantAccess({
        organizationId: tenantAccess.organizationId,
        userId: tenantAccess.userId,
      }),
    ).rejects.toHaveProperty('code', 'ORGANIZATION_NOT_FOUND');
  });

  it('allows requested permission and rejects missing permission', async () => {
    cacheGet.mockResolvedValue({
      memberId: tenantAccess.memberId,
      permissions: ['organization:read'],
    });

    await expect(
      service.ensurePermission({
        organizationId: tenantAccess.organizationId,
        userId: tenantAccess.userId,
        permission: 'organization:read',
      }),
    ).resolves.toMatchObject({ memberId: tenantAccess.memberId });

    await expect(
      service.ensurePermission({
        organizationId: tenantAccess.organizationId,
        userId: tenantAccess.userId,
        permission: 'role:manage',
      }),
    ).rejects.toHaveProperty('code', 'RBAC_FORBIDDEN');
  });
});
