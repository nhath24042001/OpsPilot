import type { createConfirmKnowledgeUploadUseCase } from './use-cases/confirm-knowledge-upload.use-case.js';
import type { createGetKnowledgeDocumentUseCase } from './use-cases/get-knowledge-document.use-case.js';
import type { createIndexKnowledgeDocumentUseCase } from './use-cases/index-knowledge-document.use-case.js';
import type { createListKnowledgeDocumentsUseCase } from './use-cases/list-knowledge-documents.use-case.js';
import type { createReindexKnowledgeDocumentUseCase } from './use-cases/reindex-knowledge-document.use-case.js';
import type { createRequestKnowledgeUploadUrlUseCase } from './use-cases/request-knowledge-upload-url.use-case.js';

export type KnowledgeBaseUseCases = {
  requestUploadUrl: ReturnType<typeof createRequestKnowledgeUploadUrlUseCase>;
  confirmUpload: ReturnType<typeof createConfirmKnowledgeUploadUseCase>;
  listDocuments: ReturnType<typeof createListKnowledgeDocumentsUseCase>;
  getDocument: ReturnType<typeof createGetKnowledgeDocumentUseCase>;
  reindexDocument: ReturnType<typeof createReindexKnowledgeDocumentUseCase>;
  indexDocument: ReturnType<typeof createIndexKnowledgeDocumentUseCase>;
};

export const createKnowledgeBaseService = (useCases: KnowledgeBaseUseCases) => ({
  requestUploadUrl: useCases.requestUploadUrl.execute.bind(useCases.requestUploadUrl),
  confirmUpload: useCases.confirmUpload.execute.bind(useCases.confirmUpload),
  listDocuments: useCases.listDocuments.execute.bind(useCases.listDocuments),
  getDocument: useCases.getDocument.execute.bind(useCases.getDocument),
  getDocumentDownloadUrl: useCases.getDocument.downloadUrl.bind(useCases.getDocument),
  reindexDocument: useCases.reindexDocument.execute.bind(useCases.reindexDocument),
  indexDocument: useCases.indexDocument.execute.bind(useCases.indexDocument),
});
