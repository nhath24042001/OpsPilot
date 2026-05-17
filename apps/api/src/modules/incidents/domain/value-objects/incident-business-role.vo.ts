export const INCIDENT_BUSINESS_ROLES = [
  'SERVICE_OWNER',
  'INCIDENT_COMMANDER',
  'ASSIGNEE',
] as const;

export type IncidentBusinessRole = (typeof INCIDENT_BUSINESS_ROLES)[number];

export type IncidentParticipant = {
  memberId: string;
  role: IncidentBusinessRole;
};
