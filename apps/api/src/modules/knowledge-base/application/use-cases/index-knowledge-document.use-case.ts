import { domainError } from '../../../../shared/errors/app-error.js';
import type { DistributedLockPort } from '../ports/distributed-lock.port.js';
import type { EmbeddingProviderPort } from '../ports/embedding-provider.port.js';
import type { ObjectStoragePort } from '../ports/object-storage.port.js';
import { chunkDocumentText } from '../services/document-chunker.js';
import type { KnowledgeDocumentRepository } from '../../domain/repositories/knowledge-document.repository.js';

const INDEX_LOCK_TTL_MS = 5 * 60 * 1000;

type Deps = {
  knowledgeDocumentRepository: KnowledgeDocumentRepository;
  objectStorage: ObjectStoragePort;
  embeddingProvider: EmbeddingProviderPort;
  distributedLock: DistributedLockPort;
};

export const createIndexKnowledgeDocumentUseCase = (deps: Deps) => ({
  async execute(input: { organizationId: string; documentId: string }) {
    const lock = await deps.distributedLock.acquire({
      key: `lock:document:index:${input.documentId}`,
      ttlMs: INDEX_LOCK_TTL_MS,
    });

    if (!lock) {
      return { indexed: false, skipped: 'LOCKED' as const };
    }

    try {
      const document = await deps.knowledgeDocumentRepository.findIndexingTarget(input);
      if (!document) {
        throw domainError('RESOURCE_NOT_FOUND');
      }

      const text = await deps.objectStorage.readTextObject(document.file.objectKey);
      const textChunks = chunkDocumentText(text);
      const chunks = await Promise.all(
        textChunks.map(async (chunk) => ({
          ...chunk,
          embedding: await deps.embeddingProvider.embed(chunk.content),
        })),
      );

      await deps.knowledgeDocumentRepository.replaceChunksAndMarkIndexed({
        organizationId: input.organizationId,
        documentId: input.documentId,
        chunks,
      });

      return { indexed: true, chunks: chunks.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown indexing error';
      await deps.knowledgeDocumentRepository.markIndexFailed({
        organizationId: input.organizationId,
        documentId: input.documentId,
        error: message,
      });
      throw error;
    } finally {
      await deps.distributedLock.release(lock);
    }
  },
});
