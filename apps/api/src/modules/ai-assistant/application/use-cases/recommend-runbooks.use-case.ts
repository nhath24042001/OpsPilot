import { domainError } from '../../../../shared/errors/app-error.js';
import type { EmbeddingProviderPort } from '../../../knowledge-base/application/ports/embedding-provider.port.js';
import type { RagRepository } from '../../domain/repositories/rag.repository.js';
import type { PostmortemRepository } from '../../domain/repositories/postmortem.repository.js';
import { toAssistantSources } from '../services/rag-prompt.js';

const DEFAULT_TOP_K = 5;

type Deps = {
  embeddingProvider: EmbeddingProviderPort;
  ragRepository: RagRepository;
  postmortemRepository: PostmortemRepository;
};

export const createRecommendRunbooksUseCase = (deps: Deps) => ({
  async execute(input: { organizationId: string; incidentId: string; topK?: number }) {
    const incident = await deps.postmortemRepository.findIncident({
      organizationId: input.organizationId,
      incidentId: input.incidentId,
    });

    if (!incident) {
      throw domainError('INCIDENT_NOT_FOUND');
    }

    const query = [incident.title, incident.description, incident.serviceName, incident.severity]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .join('\n');
    const embedding = await deps.embeddingProvider.embed(query);
    const sources = await deps.ragRepository.search({
      organizationId: input.organizationId,
      embedding,
      limit: input.topK ?? DEFAULT_TOP_K,
    });

    return {
      incidentId: input.incidentId,
      recommendations: toAssistantSources(sources),
    };
  },
});
