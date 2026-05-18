import type { IncidentSeverity, IncidentStatus, IncidentTimelineEventType, Prisma } from '@prisma/client';

export type IncidentForPostmortem = {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  rootCause: string | null;
  resolution: string | null;
  serviceName: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  timelineEvents: Array<{
    type: IncidentTimelineEventType;
    message: string | null;
    metadata: Prisma.JsonValue;
    createdAt: Date;
  }>;
  comments: Array<{
    body: string;
    createdAt: Date;
  }>;
};

export type PostmortemEntity = {
  id: string;
  organizationId: string;
  incidentId: string;
  generatedByUserId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};
