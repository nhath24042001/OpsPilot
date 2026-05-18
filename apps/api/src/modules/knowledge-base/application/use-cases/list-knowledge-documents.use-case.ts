import type { KnowledgeDocumentStatus } from '@prisma/client';
import type { CursorPageInput } from '../../../../shared/pagination/cursor-pagination.js';
import type { KnowledgeDocumentRepository } from '../../domain/repositories/knowledge-document.repository.js';

type Deps = {
  knowledgeDocumentRepository: KnowledgeDocumentRepository;
};

type Input = CursorPageInput & {
  organizationId: string;
  status?: KnowledgeDocumentStatus;
};

export const createListKnowledgeDocumentsUseCase = (deps: Deps) => ({
  async execute(input: Input) {
    return deps.knowledgeDocumentRepository.list(input.organizationId, {
      limit: input.limit,
      cursor: input.cursor,
      status: input.status,
    });
  },
});
