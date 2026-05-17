import { Prisma, type IncidentTimelineEventType } from '@prisma/client';
import { prisma } from '../../../../shared/database/prisma.js';
import { domainError } from '../../../../shared/errors/app-error.js';
import {
  decodeCreatedAtCursor,
  normalizeLimit,
  toCursorPage,
} from '../../../../shared/pagination/cursor-pagination.js';
import type {
  AssignIncidentInput,
  CreateIncidentInput,
  IncidentActionInput,
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

type IncidentEventInput = {
  organizationId: string;
  incidentId: string;
  actorMemberId: string | null;
  type: IncidentTimelineEventType;
  message: string;
  payload: Prisma.InputJsonObject;
};

const writeTimelineAndOutbox = async (
  tx: Prisma.TransactionClient,
  input: IncidentEventInput,
) => {
  const timelineEvent = await tx.incidentTimelineEvent.create({
    data: {
      organizationId: input.organizationId,
      incidentId: input.incidentId,
      actorMemberId: input.actorMemberId,
      type: input.type,
      message: input.message,
      metadata: input.payload,
    },
  });

  await tx.outboxEvent.create({
    data: {
      organizationId: input.organizationId,
      aggregateType: 'incident',
      aggregateId: input.incidentId,
      eventType: input.type.toLowerCase().replaceAll('_', '.'),
      routingKey: input.type.toLowerCase().replaceAll('_', '.'),
      payload: {
        ...input.payload,
        organizationId: input.organizationId,
        incidentId: input.incidentId,
        timelineEventId: timelineEvent.id,
      },
    },
  });
};

const findIncidentForUpdate = async (
  tx: Prisma.TransactionClient,
  input: { organizationId: string; incidentId: string },
) => {
  const incident = await tx.incident.findFirst({
    where: {
      id: input.incidentId,
      organizationId: input.organizationId,
      deletedAt: null,
    },
  });

  if (!incident) {
    throw domainError('INCIDENT_NOT_FOUND');
  }

  return incident;
};

export const prismaIncidentRepository: IncidentRepository = {
  async create(input: CreateIncidentInput) {
    return prisma.$transaction(
      async (tx) => {
        const incident = await tx.incident.create({
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

        await writeTimelineAndOutbox(tx, {
          organizationId: input.organizationId,
          incidentId: incident.id,
          actorMemberId: input.actorMemberId,
          type: 'INCIDENT_CREATED',
          message: 'Incident created',
          payload: {
            title: incident.title,
            severity: incident.severity,
            status: incident.status,
            serviceId: incident.serviceId,
            assignedMemberId: incident.assignedMemberId,
            commanderMemberId: incident.commanderMemberId,
          },
        });

        return incident;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
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

  async acknowledge(input: IncidentActionInput) {
    return prisma.$transaction(
      async (tx) => {
        const current = await findIncidentForUpdate(tx, input);
        const incident = await tx.incident.update({
          where: { id: current.id },
          data: {
            status: 'ACKNOWLEDGED',
            acknowledgedAt: new Date(),
          },
        });

        await writeTimelineAndOutbox(tx, {
          organizationId: input.organizationId,
          incidentId: input.incidentId,
          actorMemberId: input.actorMemberId,
          type: 'INCIDENT_ACKNOWLEDGED',
          message: 'Incident acknowledged',
          payload: { previousStatus: current.status, status: incident.status },
        });

        return incident;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  },

  async assign(input: AssignIncidentInput) {
    return prisma.$transaction(
      async (tx) => {
        const current = await findIncidentForUpdate(tx, input);
        const incident = await tx.incident.update({
          where: { id: current.id },
          data: {
            assignedMemberId: input.assignedMemberId,
          },
        });

        await writeTimelineAndOutbox(tx, {
          organizationId: input.organizationId,
          incidentId: input.incidentId,
          actorMemberId: input.actorMemberId,
          type: 'INCIDENT_ASSIGNED',
          message: 'Incident assigned',
          payload: {
            previousAssignedMemberId: current.assignedMemberId,
            assignedMemberId: incident.assignedMemberId,
            status: incident.status,
          },
        });

        return incident;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  },

  async resolve(input: ResolveIncidentInput) {
    return prisma.$transaction(
      async (tx) => {
        const current = await findIncidentForUpdate(tx, input);
        const incident = await tx.incident.update({
          where: { id: current.id },
          data: {
            status: 'RESOLVED',
            rootCause: input.rootCause,
            resolution: input.resolution,
            resolvedAt: new Date(),
          },
        });

        await writeTimelineAndOutbox(tx, {
          organizationId: input.organizationId,
          incidentId: input.incidentId,
          actorMemberId: input.actorMemberId,
          type: 'INCIDENT_RESOLVED',
          message: 'Incident resolved',
          payload: {
            previousStatus: current.status,
            status: incident.status,
            rootCause: incident.rootCause,
            resolution: incident.resolution,
          },
        });

        return incident;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  },

  async cancel(input: IncidentActionInput) {
    return prisma.$transaction(
      async (tx) => {
        const current = await findIncidentForUpdate(tx, input);
        const incident = await tx.incident.update({
          where: { id: current.id },
          data: {
            status: 'CANCELED',
            canceledAt: new Date(),
          },
        });

        await writeTimelineAndOutbox(tx, {
          organizationId: input.organizationId,
          incidentId: input.incidentId,
          actorMemberId: input.actorMemberId,
          type: 'INCIDENT_CANCELED',
          message: 'Incident canceled',
          payload: { previousStatus: current.status, status: incident.status },
        });

        return incident;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
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
