import { domainError } from '../../../../shared/errors/app-error.js';
import type { ObjectStoragePort } from '../ports/object-storage.port.js';
import type { KnowledgeDocumentRepository } from '../../domain/repositories/knowledge-document.repository.js';

const DOWNLOAD_URL_TTL_SECONDS = 10 * 60;

type Deps = {
  knowledgeDocumentRepository: KnowledgeDocumentRepository;
  objectStorage: ObjectStoragePort;
};

export const createGetKnowledgeDocumentUseCase = (deps: Deps) => ({
  async execute(input: { organizationId: string; documentId: string }) {
    const document = await deps.knowledgeDocumentRepository.find(input);
    if (!document) {
      throw domainError('RESOURCE_NOT_FOUND');
    }

    return { document };
  },

  async downloadUrl(input: { organizationId: string; documentId: string }) {
    const document = await deps.knowledgeDocumentRepository.find(input);
    if (!document) {
      throw domainError('RESOURCE_NOT_FOUND');
    }

    const download = await deps.objectStorage.createDownloadUrl({
      objectKey: document.file.objectKey,
      expiresInSeconds: DOWNLOAD_URL_TTL_SECONDS,
    });

    return { download };
  },
});
