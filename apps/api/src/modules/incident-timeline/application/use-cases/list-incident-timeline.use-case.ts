import { domainError } from '../../../../shared/errors/app-error.js';
import type {
  IncidentTimelineRepository,
} from '../../domain/repositories/incident-timeline.repository.js';

type Deps = {
  incidentTimelineRepository: IncidentTimelineRepository;
};

type Input = {
  organizationId: string;
  incidentId: string;
  limit?: number;
  cursor?: string;
};

export const createListIncidentTimelineUseCase = (deps: Deps) => ({
  async execute(input: Input) {
    const incidentExists = await deps.incidentTimelineRepository.incidentExists(input);
    if (!incidentExists) {
      throw domainError('INCIDENT_NOT_FOUND');
    }

    return deps.incidentTimelineRepository.listEvents(input);
  },
});
