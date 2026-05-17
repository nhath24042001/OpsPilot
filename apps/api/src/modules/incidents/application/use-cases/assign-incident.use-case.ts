import { domainError } from '../../../../shared/errors/app-error.js';
import type { IncidentRepository } from '../../domain/repositories/incident.repository.js';

type Deps = {
  incidentRepository: IncidentRepository;
};

type Input = {
  organizationId: string;
  incidentId: string;
  assignedMemberId: string;
};

export const createAssignIncidentUseCase = (deps: Deps) => ({
  async execute(input: Input) {
    const incident = await deps.incidentRepository.findActive(input);
    if (!incident) {
      throw domainError('INCIDENT_NOT_FOUND');
    }

    if (incident.status === 'RESOLVED' || incident.status === 'CANCELED') {
      throw domainError('INCIDENT_INVALID_TRANSITION', {
        from: incident.status,
        to: 'ASSIGNED',
      });
    }

    const memberExists = await deps.incidentRepository.memberExists({
      organizationId: input.organizationId,
      memberId: input.assignedMemberId,
    });
    if (!memberExists) {
      throw domainError('ORGANIZATION_MEMBER_NOT_FOUND');
    }

    return { incident: await deps.incidentRepository.assign(input) };
  },
});
