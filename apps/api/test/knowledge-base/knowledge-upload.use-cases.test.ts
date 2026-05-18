import { describe, expect, it, vi } from 'vitest';
import { createConfirmKnowledgeUploadUseCase } from '../../src/modules/knowledge-base/application/use-cases/confirm-knowledge-upload.use-case.js';
import { createRequestKnowledgeUploadUrlUseCase } from '../../src/modules/knowledge-base/application/use-cases/request-knowledge-upload-url.use-case.js';
import type { ObjectStoragePort } from '../../src/modules/knowledge-base/application/ports/object-storage.port.js';
import type { KnowledgeDocumentRepository } from '../../src/modules/knowledge-base/domain/repositories/knowledge-document.repository.js';

describe('knowledge upload use cases', () => {
  it('creates a pending file and returns a MinIO upload URL', async () => {
    const file = {
      id: 'file-1',
      organizationId: 'org-1',
      objectKey: 'orgs/org-1/knowledge/file.md',
      originalName: 'runbook.md',
      contentType: 'text/markdown',
      byteSize: 42,
      status: 'PENDING_UPLOAD' as const,
      createdByMemberId: 'member-1',
      uploadedAt: null,
      createdAt: new Date('2026-05-18T00:00:00.000Z'),
      updatedAt: new Date('2026-05-18T00:00:00.000Z'),
    };
    const repository = {
      createPendingUpload: vi
        .fn<KnowledgeDocumentRepository['createPendingUpload']>()
        .mockResolvedValue(file),
    } as Pick<KnowledgeDocumentRepository, 'createPendingUpload'> as KnowledgeDocumentRepository;
    const storage = {
      createUploadUrl: vi.fn<ObjectStoragePort['createUploadUrl']>().mockResolvedValue({
        url: 'http://minio/upload',
        method: 'PUT',
        expiresInSeconds: 900,
      }),
    } as Pick<ObjectStoragePort, 'createUploadUrl'> as ObjectStoragePort;

    const useCase = createRequestKnowledgeUploadUrlUseCase({
      knowledgeDocumentRepository: repository,
      objectStorage: storage,
    });
    const result = await useCase.execute({
      organizationId: 'org-1',
      createdByMemberId: 'member-1',
      filename: 'runbook.md',
      contentType: 'text/markdown',
      byteSize: 42,
    });

    expect(repository.createPendingUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        originalName: 'runbook.md',
      }),
    );
    expect(storage.createUploadUrl).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: 'text/markdown' }),
    );
    expect(result.file).toEqual(file);
    expect(result.upload.method).toBe('PUT');
  });

  it('confirms an upload through the repository and returns the document', async () => {
    const document = {
      id: 'document-1',
      organizationId: 'org-1',
      fileId: 'file-1',
      title: 'RabbitMQ Runbook',
      status: 'PENDING_INDEX' as const,
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
        byteSize: 42,
        status: 'UPLOADED' as const,
        createdByMemberId: 'member-1',
        uploadedAt: new Date('2026-05-18T00:00:00.000Z'),
        createdAt: new Date('2026-05-18T00:00:00.000Z'),
        updatedAt: new Date('2026-05-18T00:00:00.000Z'),
      },
      chunkCount: 0,
    };
    const repository = {
      confirmUpload: vi
        .fn<KnowledgeDocumentRepository['confirmUpload']>()
        .mockResolvedValue(document),
    } as Pick<KnowledgeDocumentRepository, 'confirmUpload'> as KnowledgeDocumentRepository;
    const useCase = createConfirmKnowledgeUploadUseCase({
      knowledgeDocumentRepository: repository,
    });

    const result = await useCase.execute({
      organizationId: 'org-1',
      createdByMemberId: 'member-1',
      fileId: 'file-1',
      title: 'RabbitMQ Runbook',
    });

    expect(repository.confirmUpload).toHaveBeenCalledWith({
      organizationId: 'org-1',
      createdByMemberId: 'member-1',
      fileId: 'file-1',
      title: 'RabbitMQ Runbook',
    });
    expect(result.document.status).toBe('PENDING_INDEX');
  });
});
