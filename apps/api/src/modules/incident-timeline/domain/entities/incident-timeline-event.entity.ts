import type { IncidentTimelineEventType, Prisma } from '@prisma/client';

export type IncidentTimelineEventEntity = {
  id: string;
  organizationId: string;
  incidentId: string;
  actorMemberId: string | null;
  type: IncidentTimelineEventType;
  message: string | null;
  metadata: Prisma.JsonValue;
  createdAt: Date;
};

export type IncidentCommentEntity = {
  id: string;
  organizationId: string;
  incidentId: string;
  authorMemberId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};
