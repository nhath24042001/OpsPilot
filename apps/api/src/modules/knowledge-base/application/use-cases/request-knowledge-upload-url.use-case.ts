import { randomUUID } from 'node:crypto';
import { domainError } from '../../../../shared/errors/app-error.js';
import type { ObjectStoragePort } from '../ports/object-storage.port.js';
import type { KnowledgeDocumentRepository } from '../../domain/repositories/knowledge-document.repository.js';
import { isSupportedKnowledgeDocument } from '../services/supported-document.js';

const UPLOAD_URL_TTL_SECONDS = 15 * 60;

type Deps = {
  knowledgeDocumentRepository: KnowledgeDocumentRepository;
  objectStorage: ObjectStoragePort;
};

type Input = {
  organizationId: string;
  createdByMemberId: string;
  filename: string;
  contentType: string;
  byteSize: number;
};

export const createRequestKnowledgeUploadUrlUseCase = (deps: Deps) => ({
  async execute(input: Input) {
    if (!isSupportedKnowledgeDocument({ filename: input.filename, contentType: input.contentType })) {
      throw domainError('VALIDATION_FAILED', {
        filename: ['Supported extensions: .md, .txt, .log, .json'],
      });
    }

    const objectKey = `orgs/${input.organizationId}/knowledge/${randomUUID()}-${input.filename}`;
    const file = await deps.knowledgeDocumentRepository.createPendingUpload({
      organizationId: input.organizationId,
      createdByMemberId: input.createdByMemberId,
      originalName: input.filename,
      contentType: input.contentType,
      byteSize: input.byteSize,
      objectKey,
    });
    const upload = await deps.objectStorage.createUploadUrl({
      objectKey,
      contentType: input.contentType,
      expiresInSeconds: UPLOAD_URL_TTL_SECONDS,
    });

    return { file, upload };
  },
});
