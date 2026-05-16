import { createPermissionService } from './application/services/permission-service.js';
import { createAssignMemberRolesUseCase } from './application/use-cases/assign-member-roles.use-case.js';
import { createUpdateRolePermissionsUseCase } from './application/use-cases/update-role-permissions.use-case.js';
import { prismaAccessControlRepository } from './infrastructure/prisma/prisma-access-control.repository.js';
import { redisPermissionCache } from './infrastructure/redis/redis-permission-cache.js';

export const createAccessControlModule = () => {
  const accessControlRepository = prismaAccessControlRepository;
  const permissionCache = redisPermissionCache;

  const permissionService = createPermissionService({
    accessControlRepository,
    permissionCache,
  });

  const updateRolePermissionsUseCase = createUpdateRolePermissionsUseCase({
    accessControlRepository,
    permissionCache,
  });

  const assignMemberRolesUseCase = createAssignMemberRolesUseCase({
    accessControlRepository,
    permissionCache,
  });

  return {
    permissionService,
    updateRolePermissionsUseCase,
    assignMemberRolesUseCase,
  };
};

export const accessControlModule = createAccessControlModule();
