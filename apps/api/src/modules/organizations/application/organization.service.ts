import { Prisma } from '@prisma/client';
import { prisma } from '../../../shared/database/prisma.js';
import { conflict, notFound } from '../../../shared/errors/app-error.js';

const defaultPermissions = [
  'organization:read',
  'member:invite',
  'role:manage',
  'service:create',
  'service:read',
  'service:update',
  'service:delete',
  'incident:create',
  'incident:read',
  'incident:update',
  'incident:assign',
  'incident:resolve',
  'knowledge:create',
  'knowledge:read',
  'knowledge:index',
  'knowledge:delete',
  'ai:ask',
  'ai:summarize',
  'audit:read',
];

export const organizationService = {
  async create(input: { userId: string; name: string }) {
    try {
      return await prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: { name: input.name },
        });

        const member = await tx.organizationMember.create({
          data: {
            organizationId: organization.id,
            userId: input.userId,
          },
        });

        await tx.permission.createMany({
          data: defaultPermissions.map((key) => ({ key })),
          skipDuplicates: true,
        });

        const ownerRole = await tx.role.create({
          data: {
            organizationId: organization.id,
            name: 'Owner',
            isSystem: true,
          },
        });

        const permissions = await tx.permission.findMany({
          where: { key: { in: defaultPermissions } },
          select: { id: true },
        });

        await tx.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: ownerRole.id,
            permissionId: permission.id,
          })),
        });

        await tx.memberRole.create({
          data: {
            memberId: member.id,
            roleId: ownerRole.id,
          },
        });

        return organization;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw conflict('Organization slug already exists');
      }
      throw error;
    }
  },

  async listForUser(userId: string) {
    const memberships = await prisma.organizationMember.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        deletedAt: null,
        organization: { deletedAt: null },
      },
      include: { organization: true },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((membership) => membership.organization);
  },

  async getForUser(input: { userId: string; organizationId: string }) {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: input.organizationId,
          userId: input.userId,
        },
      },
      include: { organization: true },
    });

    if (
      !membership ||
      membership.status !== 'ACTIVE' ||
      membership.deletedAt ||
      membership.organization.deletedAt
    ) {
      throw notFound('Organization not found');
    }

    return membership.organization;
  },
};
