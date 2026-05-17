import { domainError } from '../../../../shared/errors/app-error.js';
import type { IncidentRepository } from '../../domain/repositories/incident.repository.js';
import { assertIncidentTransition } from '../../domain/value-objects/incident-lifecycle.vo.js';

type Deps = {
  incidentRepository: IncidentRepository;
};

export const createAcknowledgeIncidentUseCase = (deps: Deps) => ({
  async execute(input: { organizationId: string; incidentId: string }) {
    const incident = await deps.incidentRepository.findActive(input);
    if (!incident) {
      throw domainError('INCIDENT_NOT_FOUND');
    }

    assertIncidentTransition(incident.status, 'ACKNOWLEDGED');

    return { incident: await deps.incidentRepository.acknowledge(input) };
  },
});
