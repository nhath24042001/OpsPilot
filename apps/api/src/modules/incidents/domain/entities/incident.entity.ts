import type { IncidentSeverity, IncidentStatus } from '@prisma/client';

export type IncidentEntity = {
  id: string;
  organizationId: string;
  serviceId: string | null;
  commanderMemberId: string | null;
  assignedMemberId: string | null;
  title: string;
  description: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  rootCause: string | null;
  resolution: string | null;
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
  canceledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};
