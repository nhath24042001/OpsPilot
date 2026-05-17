import type { IncidentSeverity, IncidentStatus } from '@prisma/client';
import { domainError } from '../../../../shared/errors/app-error.js';

const allowedTransitions: Record<IncidentStatus, readonly IncidentStatus[]> = {
  OPEN: ['ACKNOWLEDGED', 'RESOLVED', 'CANCELED'],
  ACKNOWLEDGED: ['RESOLVED', 'CANCELED'],
  RESOLVED: [],
  CANCELED: [],
};

export const assertIncidentTransition = (from: IncidentStatus, to: IncidentStatus): void => {
  if (!allowedTransitions[from].includes(to)) {
    throw domainError('INCIDENT_INVALID_TRANSITION', { from, to });
  }
};

export const assertSev1HasOwner = (input: {
  severity: IncidentSeverity;
  assignedMemberId?: string | null;
  commanderMemberId?: string | null;
}): void => {
  if (input.severity === 'SEV1' && !input.assignedMemberId && !input.commanderMemberId) {
    throw domainError('VALIDATION_FAILED', {
      assignedMemberId: ['SEV1 incident requires an assignee or incident commander'],
    });
  }
};

export const assertResolutionDetail = (input: {
  rootCause?: string | null;
  resolution?: string | null;
}): void => {
  if (!input.rootCause?.trim() || !input.resolution?.trim()) {
    throw domainError('VALIDATION_FAILED', {
      rootCause: ['Root cause is required to resolve an incident'],
      resolution: ['Resolution is required to resolve an incident'],
    });
  }
};
