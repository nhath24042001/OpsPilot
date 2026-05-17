import type { IncidentSeverity, IncidentStatus } from '@prisma/client';
import type { CursorPage, CursorPageInput } from '../../../../shared/pagination/cursor-pagination.js';
import type { IncidentEntity } from '../entities/incident.entity.js';

export type IncidentListFilters = CursorPageInput & {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  serviceId?: string;
};

export type CreateIncidentInput = {
  organizationId: string;
  serviceId?: string | null;
  commanderMemberId?: string | null;
  assignedMemberId?: string | null;
  title: string;
  description?: string | null;
  severity: IncidentSeverity;
};

export type AssignIncidentInput = {
  organizationId: string;
  incidentId: string;
  assignedMemberId: string;
};

export type ResolveIncidentInput = {
  organizationId: string;
  incidentId: string;
  rootCause: string;
  resolution: string;
};

export interface IncidentRepository {
  create(input: CreateIncidentInput): Promise<IncidentEntity>;
  list(organizationId: string, filters: IncidentListFilters): Promise<CursorPage<IncidentEntity>>;
  findActive(input: { organizationId: string; incidentId: string }): Promise<IncidentEntity | null>;
  acknowledge(input: { organizationId: string; incidentId: string }): Promise<IncidentEntity>;
  assign(input: AssignIncidentInput): Promise<IncidentEntity>;
  resolve(input: ResolveIncidentInput): Promise<IncidentEntity>;
  cancel(input: { organizationId: string; incidentId: string }): Promise<IncidentEntity>;
  memberExists(input: { organizationId: string; memberId: string }): Promise<boolean>;
  serviceExists(input: { organizationId: string; serviceId: string }): Promise<boolean>;
}
