import { Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/database/prisma.js';
import {
  decodeCreatedAtCursor,
  normalizeLimit,
  toCursorPage,
} from '../../../../shared/pagination/cursor-pagination.js';
import type {
  AddIncidentCommentInput,
  IncidentTimelineRepository,
} from '../../domain/repositories/incident-timeline.repository.js';

const cursorWhere = (
  cursor: ReturnType<typeof decodeCreatedAtCursor>,
): Prisma.IncidentTimelineEventWhereInput => {
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

export const prismaIncidentTimelineRepository: IncidentTimelineRepository = {
  async listEvents(input) {
    const limit = normalizeLimit(input.limit);
    const cursor = decodeCreatedAtCursor(input.cursor);
    const records = await prisma.incidentTimelineEvent.findMany({
      where: {
        organizationId: input.organizationId,
        incidentId: input.incidentId,
        ...cursorWhere(cursor),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    return toCursorPage(records, limit);
  },

  async addComment(input: AddIncidentCommentInput) {
    return prisma.$transaction(
      async (tx) => {
        const comment = await tx.incidentComment.create({
          data: {
            organizationId: input.organizationId,
            incidentId: input.incidentId,
            authorMemberId: input.authorMemberId,
            body: input.body,
          },
        });

        const timelineEvent = await tx.incidentTimelineEvent.create({
          data: {
            organizationId: input.organizationId,
            incidentId: input.incidentId,
            actorMemberId: input.authorMemberId,
            type: 'COMMENT_ADDED',
            message: 'Comment added',
            metadata: { commentId: comment.id },
          },
        });

        await tx.outboxEvent.create({
          data: {
            organizationId: input.organizationId,
            aggregateType: 'incident',
            aggregateId: input.incidentId,
            eventType: 'incident.comment_added',
            routingKey: 'incident.comment_added',
            payload: {
              organizationId: input.organizationId,
              incidentId: input.incidentId,
              commentId: comment.id,
              timelineEventId: timelineEvent.id,
            },
          },
        });

        return { comment, timelineEvent };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  },

  async incidentExists(input) {
    const count = await prisma.incident.count({
      where: {
        id: input.incidentId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
    });

    return count > 0;
  },
};
