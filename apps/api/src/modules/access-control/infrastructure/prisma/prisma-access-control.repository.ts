import { prisma } from '../../../../shared/database/prisma.js';
import { domainError } from '../../../../shared/errors/app-error.js';
import type {
  AccessControlRepository,
  AssignMemberRolesInput,
  UpdateRolePermissionsInput,
} from '../../domain/repositories/access-control.repository.js';
import { assertPermissions } from '../../domain/value-objects/permission.vo.js';

export const prismaAccessControlRepository: AccessControlRepository = {
  async findTenantAccess(input: { organizationId: string; userId: string }) {
    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId: input.organizationId,
        userId: input.userId,
        status: 'ACTIVE',
        deletedAt: null,
        organization: { deletedAt: null },
      },
      include: {
        roles: {
          where: {
            role: {
              deletedAt: null,
            },
          },
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!member) {
      return null;
    }

    const permissions = assertPermissions(
      member.roles.flatMap((memberRole) =>
        memberRole.role.permissions.map((rolePermission) => rolePermission.permission.key),
      ),
    );

    return {
      organizationId: member.organizationId,
      memberId: member.id,
      userId: member.userId,
      permissions,
    };
  },

  async findMemberUserId(input: { organizationId: string; memberId: string }) {
    const member = await prisma.organizationMember.findFirst({
      where: {
        id: input.memberId,
        organizationId: input.organizationId,
        status: 'ACTIVE',
        deletedAt: null,
        organization: { deletedAt: null },
      },
      select: { userId: true },
    });

    return member?.userId ?? null;
  },

  async updateRolePermissions(input: UpdateRolePermissionsInput) {
    return prisma.$transaction(async (tx) => {
      const role = await tx.role.findFirst({
        where: {
          id: input.roleId,
          organizationId: input.organizationId,
          deletedAt: null,
          organization: { deletedAt: null },
        },
        include: {
          members: {
            include: {
              member: {
                select: {
                  userId: true,
                  status: true,
                  deletedAt: true,
                },
              },
            },
          },
        },
      });

      if (!role) {
        throw domainError('RESOURCE_NOT_FOUND');
      }

      const permissionRecords = await tx.permission.findMany({
        where: { key: { in: [...input.permissions] } },
        select: { id: true, key: true },
      });

      if (permissionRecords.length !== input.permissions.length) {
        throw domainError('VALIDATION_FAILED', { permissions: ['Unknown permission key'] });
      }

      await tx.rolePermission.deleteMany({
        where: { roleId: input.roleId },
      });

      if (permissionRecords.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionRecords.map((permission) => ({
            roleId: input.roleId,
            permissionId: permission.id,
          })),
        });
      }

      return [
        ...new Set(
          role.members
            .filter(
              (memberRole) =>
                memberRole.member.status === 'ACTIVE' && memberRole.member.deletedAt === null,
            )
            .map((memberRole) => memberRole.member.userId),
        ),
      ];
    });
  },

  async assignMemberRoles(input: AssignMemberRolesInput) {
    return prisma.$transaction(async (tx) => {
      const member = await tx.organizationMember.findFirst({
        where: {
          id: input.memberId,
          organizationId: input.organizationId,
          status: 'ACTIVE',
          deletedAt: null,
          organization: { deletedAt: null },
        },
        select: { id: true, userId: true },
      });

      if (!member) {
        throw domainError('ORGANIZATION_MEMBER_NOT_FOUND');
      }

      const roleIds = [...new Set(input.roleIds)];
      const roles = await tx.role.findMany({
        where: {
          id: { in: roleIds },
          organizationId: input.organizationId,
          deletedAt: null,
          organization: { deletedAt: null },
        },
        select: { id: true },
      });

      if (roles.length !== roleIds.length) {
        throw domainError('RESOURCE_NOT_FOUND');
      }

      await tx.memberRole.deleteMany({
        where: { memberId: member.id },
      });

      await tx.memberRole.createMany({
        data: roleIds.map((roleId) => ({
          memberId: member.id,
          roleId,
        })),
      });

      return member.userId;
    });
  },
};
