import type { KnowledgeDocumentRepository } from '../../domain/repositories/knowledge-document.repository.js';

type Deps = {
  knowledgeDocumentRepository: KnowledgeDocumentRepository;
};

type Input = {
  organizationId: string;
  fileId: string;
  title: string;
  createdByMemberId: string;
};

export const createConfirmKnowledgeUploadUseCase = (deps: Deps) => ({
  async execute(input: Input) {
    const document = await deps.knowledgeDocumentRepository.confirmUpload(input);
    return { document };
  },
});
