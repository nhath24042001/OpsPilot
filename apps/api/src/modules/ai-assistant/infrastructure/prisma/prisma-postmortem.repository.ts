import { prisma } from '../../../../shared/database/prisma.js';
import type {
  IncidentForPostmortem,
  PostmortemEntity,
} from '../../domain/entities/postmortem.entity.js';
import type { PostmortemRepository } from '../../domain/repositories/postmortem.repository.js';

export const prismaPostmortemRepository: PostmortemRepository = {
  async findIncident(input) {
    const incident = await prisma.incident.findFirst({
      where: {
        id: input.incidentId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      include: {
        service: { select: { name: true } },
        timelineEvents: {
          orderBy: { createdAt: 'asc' },
          select: {
            type: true,
            message: true,
            metadata: true,
            createdAt: true,
          },
        },
        comments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          select: {
            body: true,
            createdAt: true,
          },
        },
      },
    });

    if (!incident) {
      return null;
    }

    return {
      id: incident.id,
      organizationId: incident.organizationId,
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      status: incident.status,
      rootCause: incident.rootCause,
      resolution: incident.resolution,
      serviceName: incident.service?.name ?? null,
      createdAt: incident.createdAt,
      resolvedAt: incident.resolvedAt,
      timelineEvents: incident.timelineEvents,
      comments: incident.comments,
    } satisfies IncidentForPostmortem;
  },

  async saveDraft(input) {
    const postmortem = await prisma.$transaction(async (tx) => {
      const saved = await tx.postmortem.upsert({
        where: { incidentId: input.incidentId },
        create: {
          organizationId: input.organizationId,
          incidentId: input.incidentId,
          generatedByUserId: input.generatedByUserId,
          title: input.title,
          content: input.content,
        },
        update: {
          generatedByUserId: input.generatedByUserId,
          title: input.title,
          content: input.content,
        },
      });

      await tx.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          aggregateType: 'postmortem',
          aggregateId: saved.id,
          eventType: 'postmortem.generated',
          routingKey: 'postmortem.generated',
          payload: {
            organizationId: input.organizationId,
            incidentId: input.incidentId,
            postmortemId: saved.id,
          },
        },
      });

      return saved;
    });

    return postmortem satisfies PostmortemEntity;
  },
};
