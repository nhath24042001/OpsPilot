import type { CursorPage, CursorPageInput } from '../../../../shared/pagination/cursor-pagination.js';
import type {
  FileEntity,
  KnowledgeChunkInput,
  KnowledgeDocumentDetail,
  KnowledgeDocumentEntity,
} from '../entities/knowledge-document.entity.js';

export type CreatePendingUploadInput = {
  organizationId: string;
  createdByMemberId: string;
  originalName: string;
  contentType: string;
  byteSize: number;
  objectKey: string;
};

export type ConfirmUploadInput = {
  organizationId: string;
  fileId: string;
  title: string;
  createdByMemberId: string;
};

export type IndexingTarget = KnowledgeDocumentEntity & {
  file: FileEntity;
};

export interface KnowledgeDocumentRepository {
  createPendingUpload(input: CreatePendingUploadInput): Promise<FileEntity>;
  confirmUpload(input: ConfirmUploadInput): Promise<KnowledgeDocumentDetail>;
  list(
    organizationId: string,
    input: CursorPageInput & { status?: KnowledgeDocumentEntity['status'] },
  ): Promise<CursorPage<KnowledgeDocumentDetail>>;
  find(input: {
    organizationId: string;
    documentId: string;
  }): Promise<KnowledgeDocumentDetail | null>;
  findIndexingTarget(input: {
    organizationId: string;
    documentId: string;
  }): Promise<IndexingTarget | null>;
  markPendingIndex(input: { organizationId: string; documentId: string }): Promise<void>;
  replaceChunksAndMarkIndexed(input: {
    organizationId: string;
    documentId: string;
    chunks: readonly KnowledgeChunkInput[];
  }): Promise<void>;
  markIndexFailed(input: {
    organizationId: string;
    documentId: string;
    error: string;
  }): Promise<void>;
}
