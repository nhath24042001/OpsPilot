import { domainError } from '../../../../shared/errors/app-error.js';
import type { KnowledgeDocumentRepository } from '../../domain/repositories/knowledge-document.repository.js';

type Deps = {
  knowledgeDocumentRepository: KnowledgeDocumentRepository;
};

export const createReindexKnowledgeDocumentUseCase = (deps: Deps) => ({
  async execute(input: { organizationId: string; documentId: string }) {
    const document = await deps.knowledgeDocumentRepository.find(input);
    if (!document) {
      throw domainError('RESOURCE_NOT_FOUND');
    }

    await deps.knowledgeDocumentRepository.markPendingIndex(input);
    return { accepted: true };
  },
});
