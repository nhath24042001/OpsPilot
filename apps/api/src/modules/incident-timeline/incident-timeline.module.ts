import { createIncidentTimelineService } from './application/incident-timeline.service.js';
import { createAddIncidentCommentUseCase } from './application/use-cases/add-incident-comment.use-case.js';
import { createListIncidentTimelineUseCase } from './application/use-cases/list-incident-timeline.use-case.js';
import { prismaIncidentTimelineRepository } from './infrastructure/prisma/prisma-incident-timeline.repository.js';

export const createIncidentTimelineModule = () => {
  const incidentTimelineRepository = prismaIncidentTimelineRepository;
  const useCases = {
    listIncidentTimeline: createListIncidentTimelineUseCase({ incidentTimelineRepository }),
    addIncidentComment: createAddIncidentCommentUseCase({ incidentTimelineRepository }),
  };

  return {
    incidentTimelineService: createIncidentTimelineService(useCases),
    incidentTimelineRepository,
  };
};

export const incidentTimelineModule = createIncidentTimelineModule();
