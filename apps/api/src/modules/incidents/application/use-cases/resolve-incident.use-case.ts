import { domainError } from '../../../../shared/errors/app-error.js';
import type { IncidentRepository } from '../../domain/repositories/incident.repository.js';
import {
  assertIncidentTransition,
  assertResolutionDetail,
} from '../../domain/value-objects/incident-lifecycle.vo.js';

type Deps = {
  incidentRepository: IncidentRepository;
};

type Input = Parameters<IncidentRepository['resolve']>[0];

export const createResolveIncidentUseCase = (deps: Deps) => ({
  async execute(input: Input) {
    assertResolutionDetail(input);

    const incident = await deps.incidentRepository.findActive(input);
    if (!incident) {
      throw domainError('INCIDENT_NOT_FOUND');
    }

    assertIncidentTransition(incident.status, 'RESOLVED');

    return { incident: await deps.incidentRepository.resolve(input) };
  },
});
