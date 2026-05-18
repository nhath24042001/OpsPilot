import type { FileUploadStatus, KnowledgeDocumentStatus } from '@prisma/client';

export type FileEntity = {
  id: string;
  organizationId: string;
  objectKey: string;
  originalName: string;
  contentType: string;
  byteSize: number;
  status: FileUploadStatus;
  createdByMemberId: string;
  uploadedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type KnowledgeDocumentEntity = {
  id: string;
  organizationId: string;
  fileId: string;
  title: string;
  status: KnowledgeDocumentStatus;
  indexError: string | null;
  indexedAt: Date | null;
  createdByMemberId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type KnowledgeDocumentDetail = KnowledgeDocumentEntity & {
  file: FileEntity;
  chunkCount: number;
};

export type KnowledgeChunkInput = {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  embedding: readonly number[];
};
