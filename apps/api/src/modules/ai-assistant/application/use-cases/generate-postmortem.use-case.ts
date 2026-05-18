import { domainError } from '../../../../shared/errors/app-error.js';
import type { LlmProviderPort } from '../ports/llm-provider.port.js';
import type { PostmortemRepository } from '../../domain/repositories/postmortem.repository.js';
import { buildPostmortemPrompt } from '../services/rag-prompt.js';

type Deps = {
  postmortemRepository: PostmortemRepository;
  llmProvider: LlmProviderPort;
};

export const createGeneratePostmortemUseCase = (deps: Deps) => ({
  async execute(input: { organizationId: string; incidentId: string; generatedByUserId: string }) {
    const incident = await deps.postmortemRepository.findIncident({
      organizationId: input.organizationId,
      incidentId: input.incidentId,
    });

    if (!incident) {
      throw domainError('INCIDENT_NOT_FOUND');
    }

    if (incident.status !== 'RESOLVED') {
      throw domainError('INCIDENT_INVALID_TRANSITION', {
        requiredStatus: 'RESOLVED',
        currentStatus: incident.status,
      });
    }

    const content = await deps.llmProvider.complete({
      system:
        'You are OpsPilot postmortem generator. Create a concise engineering postmortem draft from the incident facts.',
      prompt: buildPostmortemPrompt(incident),
    });
    const postmortem = await deps.postmortemRepository.saveDraft({
      organizationId: input.organizationId,
      incidentId: input.incidentId,
      generatedByUserId: input.generatedByUserId,
      title: `Postmortem: ${incident.title}`,
      content,
    });

    return { postmortem };
  },
});
