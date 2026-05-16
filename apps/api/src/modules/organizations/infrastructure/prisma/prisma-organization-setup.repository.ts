import { prisma } from '../../../../shared/database/prisma.js';
import { DEFAULT_PERMISSIONS } from '../../domain/value-objects/default-permissions.vo.js';
import {
  isSystemRoleName,
  SYSTEM_ROLE_NAMES,
  SYSTEM_ROLE_PERMISSIONS,
} from '../../../access-control/domain/value-objects/role.vo.js';
import type {
  OrganizationSetupRepository,
  SetupOrganizationInput,
} from '../../domain/repositories/organization-setup.repository.js';

export const prismaOrganizationSetupRepository: OrganizationSetupRepository = {
  async setupOrganizationWithOwner(input: SetupOrganizationInput) {
    return prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          id: input.organizationId,
          name: input.organizationName,
        },
      });

      const member = await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: input.userId,
          status: 'ACTIVE',
        },
      });

      await Promise.all(
        DEFAULT_PERMISSIONS.map((permission) =>
          tx.permission.upsert({
            where: { key: permission },
            create: { key: permission },
            update: {},
          }),
        ),
      );

      const permissionRecords = await tx.permission.findMany({
        where: { key: { in: [...DEFAULT_PERMISSIONS] } },
      });

      const permissionIdsByKey = new Map(
        permissionRecords.map((permission) => [permission.key, permission.id]),
      );

      const roles = await Promise.all(
        SYSTEM_ROLE_NAMES.map((roleName) =>
          tx.role.create({
            data: {
              organizationId: organization.id,
              name: roleName,
              isSystem: true,
            },
          }),
        ),
      );

      for (const role of roles) {
        if (!isSystemRoleName(role.name)) {
          throw new Error(`Unexpected system role: ${role.name}`);
        }

        const permissions = SYSTEM_ROLE_PERMISSIONS[role.name];
        await tx.rolePermission.createMany({
          data: permissions.map((permission) => {
            const permissionId = permissionIdsByKey.get(permission);
            if (!permissionId) {
              throw new Error(`Missing seeded permission: ${permission}`);
            }

            return {
              roleId: role.id,
              permissionId,
            };
          }),
        });
      }

      const ownerRole = roles.find((role) => role.name === 'Owner');
      if (!ownerRole) {
        throw new Error('Owner role was not created');
      }

      await tx.memberRole.create({
        data: {
          memberId: member.id,
          roleId: ownerRole.id,
        },
      });

      return {
        id: organization.id,
        name: organization.name,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
        deletedAt: null,
      };
    });
  },
};
