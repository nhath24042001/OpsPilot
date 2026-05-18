import type {
  IncidentForPostmortem,
  PostmortemEntity,
} from '../entities/postmortem.entity.js';

export interface PostmortemRepository {
  findIncident(input: {
    organizationId: string;
    incidentId: string;
  }): Promise<IncidentForPostmortem | null>;
  saveDraft(input: {
    organizationId: string;
    incidentId: string;
    generatedByUserId: string;
    title: string;
    content: string;
  }): Promise<PostmortemEntity>;
}
