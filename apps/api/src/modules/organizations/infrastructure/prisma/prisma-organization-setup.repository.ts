import { prisma } from '../../../../shared/database/prisma.js';
import { DEFAULT_PERMISSIONS } from '../../domain/value-objects/default-permissions.vo.js';
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

      const role = await tx.role.create({
        data: {
          organizationId: organization.id,
          name: 'Owner',
        },
      });

      const permissionRecords = await tx.permission.findMany({
        where: { key: { in: [...DEFAULT_PERMISSIONS] } },
      });

      await tx.rolePermission.createMany({
        data: permissionRecords.map((p) => ({
          roleId: role.id,
          permissionId: p.id,
        })),
      });

      await tx.memberRole.create({
        data: {
          memberId: member.id,
          roleId: role.id,
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
