import type { RagSource } from '../../domain/entities/rag-source.entity.js';
import type { IncidentForPostmortem } from '../../domain/entities/postmortem.entity.js';

export const toAssistantSources = (sources: readonly RagSource[]) =>
  sources.map((source) => ({
    documentId: source.documentId,
    title: source.documentTitle,
    chunkId: source.chunkId,
    score: source.score,
  }));

export const buildKnowledgePrompt = (input: {
  question: string;
  sources: readonly RagSource[];
}): string => {
  const context = input.sources
    .map(
      (source, index) =>
        `[${index + 1}] ${source.documentTitle} (chunk ${source.chunkIndex}, score ${source.score.toFixed(
          3,
        )})\n${source.content}`,
    )
    .join('\n\n');

  return `Question:\n${input.question}\n\nContext:\n${context || 'No indexed knowledge chunks found.'}`;
};

export const buildPostmortemPrompt = (incident: IncidentForPostmortem): string => {
  const timeline = incident.timelineEvents
    .map((event) => `- ${event.createdAt.toISOString()} ${event.type}: ${event.message ?? ''}`)
    .join('\n');
  const comments = incident.comments
    .map((comment) => `- ${comment.createdAt.toISOString()}: ${comment.body}`)
    .join('\n');

  return [
    `Incident: ${incident.title}`,
    `Service: ${incident.serviceName ?? 'Unknown'}`,
    `Severity: ${incident.severity}`,
    `Status: ${incident.status}`,
    `Description: ${incident.description ?? 'N/A'}`,
    `Root cause: ${incident.rootCause ?? 'N/A'}`,
    `Resolution: ${incident.resolution ?? 'N/A'}`,
    '',
    'Timeline:',
    timeline || '- No timeline events',
    '',
    'Comments:',
    comments || '- No comments',
  ].join('\n');
};
