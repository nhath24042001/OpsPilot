import { domainError } from '../../../../shared/errors/app-error.js';
import type {
  AddIncidentCommentInput,
  IncidentTimelineRepository,
} from '../../domain/repositories/incident-timeline.repository.js';

type Deps = {
  incidentTimelineRepository: IncidentTimelineRepository;
};

export const createAddIncidentCommentUseCase = (deps: Deps) => ({
  async execute(input: AddIncidentCommentInput) {
    const incidentExists = await deps.incidentTimelineRepository.incidentExists(input);
    if (!incidentExists) {
      throw domainError('INCIDENT_NOT_FOUND');
    }

    return deps.incidentTimelineRepository.addComment(input);
  },
});
