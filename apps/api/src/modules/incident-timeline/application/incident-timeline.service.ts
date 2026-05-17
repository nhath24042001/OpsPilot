import type { createAddIncidentCommentUseCase } from './use-cases/add-incident-comment.use-case.js';
import type { createListIncidentTimelineUseCase } from './use-cases/list-incident-timeline.use-case.js';

export type IncidentTimelineUseCases = {
  listIncidentTimeline: ReturnType<typeof createListIncidentTimelineUseCase>;
  addIncidentComment: ReturnType<typeof createAddIncidentCommentUseCase>;
};

export const createIncidentTimelineService = (useCases: IncidentTimelineUseCases) => ({
  list: useCases.listIncidentTimeline.execute.bind(useCases.listIncidentTimeline),
  addComment: useCases.addIncidentComment.execute.bind(useCases.addIncidentComment),
});
