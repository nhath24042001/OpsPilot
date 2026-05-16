import { prisma } from '../../../../shared/database/prisma.js';
import type {
  CreateOrganizationInput,
  OrganizationRepository,
} from '../../domain/repositories/organization.repository.js';
import type { Organization } from '@prisma/client';

export const prismaOrganizationRepository: OrganizationRepository = {
  async create(input: CreateOrganizationInput) {
    return prisma.organization.create({
      data: {
        name: input.name,
      },
    });
  },

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

    return memberships.map((membership: { organization: Organization }) => membership.organization);
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

