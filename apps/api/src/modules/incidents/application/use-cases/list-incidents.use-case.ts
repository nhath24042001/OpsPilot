import type {
  IncidentListFilters,
  IncidentRepository,
} from '../../domain/repositories/incident.repository.js';

type Deps = {
  incidentRepository: IncidentRepository;
};

export const createListIncidentsUseCase = (deps: Deps) => ({
  async execute(organizationId: string, filters: IncidentListFilters) {
    return deps.incidentRepository.list(organizationId, filters);
  },
});
