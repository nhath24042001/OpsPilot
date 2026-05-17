import type { Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/database/prisma.js';
import {
  decodeCreatedAtCursor,
  normalizeLimit,
  toCursorPage,
} from '../../../../shared/pagination/cursor-pagination.js';
import type {
  AssignIncidentInput,
  CreateIncidentInput,
  IncidentListFilters,
  IncidentRepository,
  ResolveIncidentInput,
} from '../../domain/repositories/incident.repository.js';

const incidentCursorWhere = (
  cursor: ReturnType<typeof decodeCreatedAtCursor>,
): Prisma.IncidentWhereInput => {
  if (!cursor) {
    return {};
  }

  return {
    OR: [
      { createdAt: { lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, id: { lt: cursor.id } },
    ],
  };
};

export const prismaIncidentRepository: IncidentRepository = {
  async create(input: CreateIncidentInput) {
    return prisma.incident.create({
      data: {
        organizationId: input.organizationId,
        serviceId: input.serviceId,
        commanderMemberId: input.commanderMemberId,
        assignedMemberId: input.assignedMemberId,
        title: input.title,
        description: input.description,
        severity: input.severity,
      },
    });
  },

  async list(organizationId: string, filters: IncidentListFilters) {
    const limit = normalizeLimit(filters.limit);
    const cursor = decodeCreatedAtCursor(filters.cursor);
    const records = await prisma.incident.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: filters.status,
        severity: filters.severity,
        serviceId: filters.serviceId,
        ...incidentCursorWhere(cursor),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    return toCursorPage(records, limit);
  },

  async findActive(input) {
    return prisma.incident.findFirst({
      where: {
        id: input.incidentId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
    });
  },

  async acknowledge(input) {
    return prisma.incident.update({
      where: {
        id: input.incidentId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
      },
    });
  },

  async assign(input: AssignIncidentInput) {
    return prisma.incident.update({
      where: {
        id: input.incidentId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      data: {
        assignedMemberId: input.assignedMemberId,
      },
    });
  },

  async resolve(input: ResolveIncidentInput) {
    return prisma.incident.update({
      where: {
        id: input.incidentId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      data: {
        status: 'RESOLVED',
        rootCause: input.rootCause,
        resolution: input.resolution,
        resolvedAt: new Date(),
      },
    });
  },

  async cancel(input) {
    return prisma.incident.update({
      where: {
        id: input.incidentId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    });
  },

  async memberExists(input) {
    const count = await prisma.organizationMember.count({
      where: {
        id: input.memberId,
        organizationId: input.organizationId,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    return count > 0;
  },

  async serviceExists(input) {
    const count = await prisma.service.count({
      where: {
        id: input.serviceId,
        organizationId: input.organizationId,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    return count > 0;
  },
};
