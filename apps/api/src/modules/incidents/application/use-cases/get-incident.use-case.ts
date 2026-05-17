import { domainError } from '../../../../shared/errors/app-error.js';
import type { IncidentRepository } from '../../domain/repositories/incident.repository.js';

type Deps = {
  incidentRepository: IncidentRepository;
};

export const createGetIncidentUseCase = (deps: Deps) => ({
  async execute(input: { organizationId: string; incidentId: string }) {
    const incident = await deps.incidentRepository.findActive(input);
    if (!incident) {
      throw domainError('INCIDENT_NOT_FOUND');
    }

    return { incident };
  },
});
