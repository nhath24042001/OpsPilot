import { domainError } from '../../../../shared/errors/app-error.js';
import type { PermissionCachePort } from '../ports/permission-cache.port.js';
import type { AccessControlRepository } from '../../domain/repositories/access-control.repository.js';

type AssignMemberRolesDeps = {
  accessControlRepository: AccessControlRepository;
  permissionCache: PermissionCachePort;
};

type AssignMemberRolesInput = {
  organizationId: string;
  memberId: string;
  roleIds: readonly string[];
};

export const createAssignMemberRolesUseCase = (deps: AssignMemberRolesDeps) => ({
  async execute(input: AssignMemberRolesInput) {
    if (input.roleIds.length === 0) {
      throw domainError('VALIDATION_FAILED', { roleIds: ['At least one role is required'] });
    }

    const userId = await deps.accessControlRepository.assignMemberRoles(input);
    await deps.permissionCache.invalidate({
      organizationId: input.organizationId,
      userId,
    });

    return {
      memberId: input.memberId,
      roleIds: [...new Set(input.roleIds)],
    };
  },
});
