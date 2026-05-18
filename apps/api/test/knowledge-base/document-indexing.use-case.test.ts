import { describe, expect, it, vi } from 'vitest';
import { createIndexKnowledgeDocumentUseCase } from '../../src/modules/knowledge-base/application/use-cases/index-knowledge-document.use-case.js';
import type { DistributedLockPort } from '../../src/modules/knowledge-base/application/ports/distributed-lock.port.js';
import type { EmbeddingProviderPort } from '../../src/modules/knowledge-base/application/ports/embedding-provider.port.js';
import type { ObjectStoragePort } from '../../src/modules/knowledge-base/application/ports/object-storage.port.js';
import type { KnowledgeDocumentRepository } from '../../src/modules/knowledge-base/domain/repositories/knowledge-document.repository.js';

const lock = { key: 'lock:document:index:document-1', token: 'token-1' };

const createTarget = () => ({
  id: 'document-1',
  organizationId: 'org-1',
  fileId: 'file-1',
  title: 'Runbook',
  status: 'INDEXING' as const,
  indexError: null,
  indexedAt: null,
  createdByMemberId: 'member-1',
  createdAt: new Date('2026-05-18T00:00:00.000Z'),
  updatedAt: new Date('2026-05-18T00:00:00.000Z'),
  file: {
    id: 'file-1',
    organizationId: 'org-1',
    objectKey: 'orgs/org-1/knowledge/file.md',
    originalName: 'runbook.md',
    contentType: 'text/markdown',
    byteSize: 100,
    status: 'UPLOADED' as const,
    createdByMemberId: 'member-1',
    uploadedAt: new Date('2026-05-18T00:00:00.000Z'),
    createdAt: new Date('2026-05-18T00:00:00.000Z'),
    updatedAt: new Date('2026-05-18T00:00:00.000Z'),
  },
});

describe('document indexing use case', () => {
  it('indexes text into embedded chunks under a Redis lock', async () => {
    const repository = {
      findIndexingTarget: vi
        .fn<KnowledgeDocumentRepository['findIndexingTarget']>()
        .mockResolvedValue(createTarget()),
      replaceChunksAndMarkIndexed: vi
        .fn<KnowledgeDocumentRepository['replaceChunksAndMarkIndexed']>()
        .mockResolvedValue(undefined),
      markIndexFailed: vi
        .fn<KnowledgeDocumentRepository['markIndexFailed']>()
        .mockResolvedValue(undefined),
    } as Pick<
      KnowledgeDocumentRepository,
      'findIndexingTarget' | 'replaceChunksAndMarkIndexed' | 'markIndexFailed'
    > as KnowledgeDocumentRepository;
    const storage = {
      readTextObject: vi
        .fn<ObjectStoragePort['readTextObject']>()
        .mockResolvedValue('First runbook step.\n\nSecond runbook step.'),
    } as Pick<ObjectStoragePort, 'readTextObject'> as ObjectStoragePort;
    const embeddingProvider = {
      dimensions: 8,
      embed: vi
        .fn<EmbeddingProviderPort['embed']>()
        .mockResolvedValue([1, 0, 0, 0, 0, 0, 0, 0]),
    };
    const distributedLock = {
      acquire: vi.fn<DistributedLockPort['acquire']>().mockResolvedValue(lock),
      release: vi.fn<DistributedLockPort['release']>().mockResolvedValue(undefined),
    };

    const useCase = createIndexKnowledgeDocumentUseCase({
      knowledgeDocumentRepository: repository,
      objectStorage: storage,
      embeddingProvider,
      distributedLock,
    });

    const result = await useCase.execute({ organizationId: 'org-1', documentId: 'document-1' });

    expect(result.indexed).toBe(true);
    expect(storage.readTextObject).toHaveBeenCalledWith('orgs/org-1/knowledge/file.md');
    expect(repository.replaceChunksAndMarkIndexed).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        documentId: 'document-1',
        chunks: expect.arrayContaining([
          expect.objectContaining({
            chunkIndex: 0,
            embedding: [1, 0, 0, 0, 0, 0, 0, 0],
          }),
        ]),
      }),
    );
    expect(distributedLock.release).toHaveBeenCalledWith(lock);
    expect(repository.markIndexFailed).not.toHaveBeenCalled();
  });

  it('skips indexing when the document lock is already held', async () => {
    const repository = {
      findIndexingTarget: vi.fn<KnowledgeDocumentRepository['findIndexingTarget']>(),
    } as Pick<KnowledgeDocumentRepository, 'findIndexingTarget'> as KnowledgeDocumentRepository;
    const useCase = createIndexKnowledgeDocumentUseCase({
      knowledgeDocumentRepository: repository,
      objectStorage: {} as ObjectStoragePort,
      embeddingProvider: { dimensions: 8, embed: vi.fn() },
      distributedLock: {
        acquire: vi.fn<DistributedLockPort['acquire']>().mockResolvedValue(null),
        release: vi.fn<DistributedLockPort['release']>().mockResolvedValue(undefined),
      },
    });

    await expect(useCase.execute({ organizationId: 'org-1', documentId: 'document-1' })).resolves.toEqual({
      indexed: false,
      skipped: 'LOCKED',
    });
    expect(repository.findIndexingTarget).not.toHaveBeenCalled();
  });

  it('marks the document as failed when indexing throws', async () => {
    const repository = {
      findIndexingTarget: vi
        .fn<KnowledgeDocumentRepository['findIndexingTarget']>()
        .mockResolvedValue(createTarget()),
      replaceChunksAndMarkIndexed: vi.fn<KnowledgeDocumentRepository['replaceChunksAndMarkIndexed']>(),
      markIndexFailed: vi
        .fn<KnowledgeDocumentRepository['markIndexFailed']>()
        .mockResolvedValue(undefined),
    } as Pick<
      KnowledgeDocumentRepository,
      'findIndexingTarget' | 'replaceChunksAndMarkIndexed' | 'markIndexFailed'
    > as KnowledgeDocumentRepository;
    const useCase = createIndexKnowledgeDocumentUseCase({
      knowledgeDocumentRepository: repository,
      objectStorage: {
        readTextObject: vi.fn<ObjectStoragePort['readTextObject']>().mockRejectedValue(new Error('MinIO down')),
      } as Pick<ObjectStoragePort, 'readTextObject'> as ObjectStoragePort,
      embeddingProvider: { dimensions: 8, embed: vi.fn() },
      distributedLock: {
        acquire: vi.fn<DistributedLockPort['acquire']>().mockResolvedValue(lock),
        release: vi.fn<DistributedLockPort['release']>().mockResolvedValue(undefined),
      },
    });

    await expect(
      useCase.execute({ organizationId: 'org-1', documentId: 'document-1' }),
    ).rejects.toThrow('MinIO down');
    expect(repository.markIndexFailed).toHaveBeenCalledWith({
      organizationId: 'org-1',
      documentId: 'document-1',
      error: 'MinIO down',
    });
  });
});
