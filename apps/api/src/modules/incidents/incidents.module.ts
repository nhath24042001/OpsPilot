import { createIncidentService } from './application/incident.service.js';
import { createAcknowledgeIncidentUseCase } from './application/use-cases/acknowledge-incident.use-case.js';
import { createAssignIncidentUseCase } from './application/use-cases/assign-incident.use-case.js';
import { createCancelIncidentUseCase } from './application/use-cases/cancel-incident.use-case.js';
import { createCreateIncidentUseCase } from './application/use-cases/create-incident.use-case.js';
import { createGetIncidentUseCase } from './application/use-cases/get-incident.use-case.js';
import { createListIncidentsUseCase } from './application/use-cases/list-incidents.use-case.js';
import { createResolveIncidentUseCase } from './application/use-cases/resolve-incident.use-case.js';
import { prismaIncidentRepository } from './infrastructure/prisma/prisma-incident.repository.js';

export const createIncidentsModule = () => {
  const incidentRepository = prismaIncidentRepository;
  const useCases = {
    createIncident: createCreateIncidentUseCase({ incidentRepository }),
    listIncidents: createListIncidentsUseCase({ incidentRepository }),
    getIncident: createGetIncidentUseCase({ incidentRepository }),
    acknowledgeIncident: createAcknowledgeIncidentUseCase({ incidentRepository }),
    assignIncident: createAssignIncidentUseCase({ incidentRepository }),
    resolveIncident: createResolveIncidentUseCase({ incidentRepository }),
    cancelIncident: createCancelIncidentUseCase({ incidentRepository }),
  };

  return {
    incidentService: createIncidentService(useCases),
    incidentRepository,
  };
};

export const incidentsModule = createIncidentsModule();
