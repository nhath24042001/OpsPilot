import { prisma } from '../../../../shared/database/prisma.js';
import {
  decodeCreatedAtCursor,
  normalizeLimit,
  toCursorPage,
} from '../../../../shared/pagination/cursor-pagination.js';
import type {
  CreateServiceInput,
  ServiceRepository,
  UpdateServiceInput,
} from '../../domain/repositories/service.repository.js';

const serviceCursorWhere = (cursor: ReturnType<typeof decodeCreatedAtCursor>) =>
  cursor
    ? {
        OR: [
          { createdAt: { lt: cursor.createdAt } },
          { createdAt: cursor.createdAt, id: { lt: cursor.id } },
        ],
      }
    : {};

export const prismaServiceRepository: ServiceRepository = {
  async create(input: CreateServiceInput) {
    return prisma.service.create({
      data: {
        organizationId: input.organizationId,
        ownerMemberId: input.ownerMemberId,
        name: input.name,
        description: input.description,
      },
    });
  },

  async list(organizationId, page) {
    const limit = normalizeLimit(page.limit);
    const cursor = decodeCreatedAtCursor(page.cursor);
    const records = await prisma.service.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...serviceCursorWhere(cursor),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    return toCursorPage(records, limit);
  },

  async findActive(input) {
    return prisma.service.findFirst({
      where: {
        id: input.serviceId,
        organizationId: input.organizationId,
        deletedAt: null,
        status: 'ACTIVE',
      },
    });
  },

  async update(input: UpdateServiceInput) {
    const service = await prisma.service.update({
      where: {
        id: input.serviceId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      data: {
        ownerMemberId: input.ownerMemberId,
        name: input.name,
        description: input.description,
      },
    });

    return service;
  },

  async softDelete(input) {
    await prisma.service.update({
      where: {
        id: input.serviceId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      data: {
        status: 'DEPRECATED',
        deletedAt: new Date(),
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
};
