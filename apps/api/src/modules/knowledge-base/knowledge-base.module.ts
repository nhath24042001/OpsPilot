import { createKnowledgeBaseService } from './application/knowledge-base.service.js';
import { createConfirmKnowledgeUploadUseCase } from './application/use-cases/confirm-knowledge-upload.use-case.js';
import { createGetKnowledgeDocumentUseCase } from './application/use-cases/get-knowledge-document.use-case.js';
import { createIndexKnowledgeDocumentUseCase } from './application/use-cases/index-knowledge-document.use-case.js';
import { createListKnowledgeDocumentsUseCase } from './application/use-cases/list-knowledge-documents.use-case.js';
import { createReindexKnowledgeDocumentUseCase } from './application/use-cases/reindex-knowledge-document.use-case.js';
import { createRequestKnowledgeUploadUrlUseCase } from './application/use-cases/request-knowledge-upload-url.use-case.js';
import { deterministicEmbeddingProvider } from './infrastructure/llm/deterministic-embedding-provider.js';
import { minioObjectStorage } from './infrastructure/minio/minio-object-storage.js';
import { prismaKnowledgeDocumentRepository } from './infrastructure/prisma/prisma-knowledge-document.repository.js';
import { redisDistributedLock } from './infrastructure/redis/redis-distributed-lock.js';

export const createKnowledgeBaseModule = () => {
  const knowledgeDocumentRepository = prismaKnowledgeDocumentRepository;
  const objectStorage = minioObjectStorage;
  const embeddingProvider = deterministicEmbeddingProvider;
  const distributedLock = redisDistributedLock;
  const useCases = {
    requestUploadUrl: createRequestKnowledgeUploadUrlUseCase({
      knowledgeDocumentRepository,
      objectStorage,
    }),
    confirmUpload: createConfirmKnowledgeUploadUseCase({ knowledgeDocumentRepository }),
    listDocuments: createListKnowledgeDocumentsUseCase({ knowledgeDocumentRepository }),
    getDocument: createGetKnowledgeDocumentUseCase({ knowledgeDocumentRepository, objectStorage }),
    reindexDocument: createReindexKnowledgeDocumentUseCase({ knowledgeDocumentRepository }),
    indexDocument: createIndexKnowledgeDocumentUseCase({
      knowledgeDocumentRepository,
      objectStorage,
      embeddingProvider,
      distributedLock,
    }),
  };

  return {
    knowledgeBaseService: createKnowledgeBaseService(useCases),
    knowledgeDocumentRepository,
  };
};

export const knowledgeBaseModule = createKnowledgeBaseModule();
