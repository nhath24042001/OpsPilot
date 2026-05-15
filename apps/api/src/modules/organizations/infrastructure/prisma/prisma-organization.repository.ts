import { prisma } from '../../../../shared/database/prisma.js';
import type { OrganizationRepository } from '../../domain/repositories/organization.repository.js';

export const prismaOrganizationRepository: OrganizationRepository = {
  async listActiveForUser(userId: string) {
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

  async findActiveForUser(input: { userId: string; organizationId: string }) {
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId: input.organizationId,
        userId: input.userId,
        status: 'ACTIVE',
        deletedAt: null,
        organization: { deletedAt: null },
      },
      include: { organization: true },
    });

    return membership?.organization ?? null;
  },
};
