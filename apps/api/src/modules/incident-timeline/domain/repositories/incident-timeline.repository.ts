import type { CursorPage, CursorPageInput } from '../../../../shared/pagination/cursor-pagination.js';
import type {
  IncidentCommentEntity,
  IncidentTimelineEventEntity,
} from '../entities/incident-timeline-event.entity.js';

export type AddIncidentCommentInput = {
  organizationId: string;
  incidentId: string;
  authorMemberId: string;
  body: string;
};

export interface IncidentTimelineRepository {
  listEvents(
    input: { organizationId: string; incidentId: string } & CursorPageInput,
  ): Promise<CursorPage<IncidentTimelineEventEntity>>;
  addComment(input: AddIncidentCommentInput): Promise<{
    comment: IncidentCommentEntity;
    timelineEvent: IncidentTimelineEventEntity;
  }>;
  incidentExists(input: { organizationId: string; incidentId: string }): Promise<boolean>;
}
