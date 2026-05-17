import type { createAcknowledgeIncidentUseCase } from './use-cases/acknowledge-incident.use-case.js';
import type { createAssignIncidentUseCase } from './use-cases/assign-incident.use-case.js';
import type { createCancelIncidentUseCase } from './use-cases/cancel-incident.use-case.js';
import type { createCreateIncidentUseCase } from './use-cases/create-incident.use-case.js';
import type { createGetIncidentUseCase } from './use-cases/get-incident.use-case.js';
import type { createListIncidentsUseCase } from './use-cases/list-incidents.use-case.js';
import type { createResolveIncidentUseCase } from './use-cases/resolve-incident.use-case.js';

export type IncidentUseCases = {
  createIncident: ReturnType<typeof createCreateIncidentUseCase>;
  listIncidents: ReturnType<typeof createListIncidentsUseCase>;
  getIncident: ReturnType<typeof createGetIncidentUseCase>;
  acknowledgeIncident: ReturnType<typeof createAcknowledgeIncidentUseCase>;
  assignIncident: ReturnType<typeof createAssignIncidentUseCase>;
  resolveIncident: ReturnType<typeof createResolveIncidentUseCase>;
  cancelIncident: ReturnType<typeof createCancelIncidentUseCase>;
};

export const createIncidentService = (useCases: IncidentUseCases) => ({
  create: useCases.createIncident.execute.bind(useCases.createIncident),
  list: useCases.listIncidents.execute.bind(useCases.listIncidents),
  get: useCases.getIncident.execute.bind(useCases.getIncident),
  acknowledge: useCases.acknowledgeIncident.execute.bind(useCases.acknowledgeIncident),
  assign: useCases.assignIncident.execute.bind(useCases.assignIncident),
  resolve: useCases.resolveIncident.execute.bind(useCases.resolveIncident),
  cancel: useCases.cancelIncident.execute.bind(useCases.cancelIncident),
});
