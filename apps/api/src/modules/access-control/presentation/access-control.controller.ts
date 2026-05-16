import type { Request, Response } from 'express';
import { accessControlModule } from '../access-control.module.js';
import { assignMemberRolesSchema, updateRolePermissionsSchema } from './access-control.validators.js';
import { getTenantContext } from './tenant-context.js';

export const accessControlController = {
  async updateRolePermissions(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { body, params } = updateRolePermissionsSchema.parse(req);

    const result = await accessControlModule.updateRolePermissionsUseCase.execute({
      organizationId: tenant.organizationId,
      roleId: params.roleId,
      permissions: body.permissions,
    });

    res.status(200).json(result);
  },

  async assignMemberRoles(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { body, params } = assignMemberRolesSchema.parse(req);

    const result = await accessControlModule.assignMemberRolesUseCase.execute({
      organizationId: tenant.organizationId,
      memberId: params.memberId,
      roleIds: body.roleIds,
    });

    res.status(200).json(result);
  },
};
