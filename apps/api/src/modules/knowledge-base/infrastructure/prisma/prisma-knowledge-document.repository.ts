import { Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/database/prisma.js';
import { domainError } from '../../../../shared/errors/app-error.js';
import {
  decodeCreatedAtCursor,
  normalizeLimit,
  toCursorPage,
} from '../../../../shared/pagination/cursor-pagination.js';
import type {
  FileEntity,
  KnowledgeDocumentDetail,
} from '../../domain/entities/knowledge-document.entity.js';
import type {
  ConfirmUploadInput,
  CreatePendingUploadInput,
  KnowledgeDocumentRepository,
} from '../../domain/repositories/knowledge-document.repository.js';

const toFileEntity = (file: {
  id: string;
  organizationId: string;
  objectKey: string;
  originalName: string;
  contentType: string;
  byteSize: bigint;
  status: FileEntity['status'];
  createdByMemberId: string;
  uploadedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): FileEntity => ({
  ...file,
  byteSize: Number(file.byteSize),
});

const toDocumentDetail = (
  document: Prisma.KnowledgeDocumentGetPayload<{
    include: { file: true; _count: { select: { chunks: true } } };
  }>,
): KnowledgeDocumentDetail => ({
  id: document.id,
  organizationId: document.organizationId,
  fileId: document.fileId,
  title: document.title,
  status: document.status,
  indexError: document.indexError,
  indexedAt: document.indexedAt,
  createdByMemberId: document.createdByMemberId,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
  file: toFileEntity(document.file),
  chunkCount: document._count.chunks,
});

const cursorWhere = (
  cursor: ReturnType<typeof decodeCreatedAtCursor>,
): Prisma.KnowledgeDocumentWhereInput => {
  if (!cursor) {
    return {};
  }

  return {
    OR: [
      { createdAt: { lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, id: { lt: cursor.id } },
    ],
  };
};

const vectorLiteral = (embedding: readonly number[]): string => {
  if (embedding.length !== 8 || embedding.some((value) => !Number.isFinite(value))) {
    throw new Error('Embedding must contain exactly 8 finite numbers');
  }

  return `[${embedding.map((value) => value.toFixed(6)).join(',')}]`;
};

const createDocumentUploadedOutbox = async (
  tx: Prisma.TransactionClient,
  document: { id: string; organizationId: string; fileId: string; title: string },
  file: { objectKey: string; originalName: string; contentType: string },
) => {
  await tx.outboxEvent.create({
    data: {
      organizationId: document.organizationId,
      aggregateType: 'knowledge_document',
      aggregateId: document.id,
      eventType: 'document.uploaded',
      routingKey: 'document.uploaded',
      payload: {
        organizationId: document.organizationId,
        documentId: document.id,
        fileId: document.fileId,
        title: document.title,
        objectKey: file.objectKey,
        originalName: file.originalName,
        contentType: file.contentType,
      },
    },
  });
};

export const prismaKnowledgeDocumentRepository: KnowledgeDocumentRepository = {
  async createPendingUpload(input: CreatePendingUploadInput) {
    const file = await prisma.file.create({
      data: {
        organizationId: input.organizationId,
        createdByMemberId: input.createdByMemberId,
        originalName: input.originalName,
        contentType: input.contentType,
        byteSize: input.byteSize,
        objectKey: input.objectKey,
      },
    });

    return toFileEntity(file);
  },

  async confirmUpload(input: ConfirmUploadInput) {
    return prisma.$transaction(
      async (tx) => {
        const file = await tx.file.findFirst({
          where: {
            id: input.fileId,
            organizationId: input.organizationId,
            status: 'PENDING_UPLOAD',
          },
        });

        if (!file) {
          throw domainError('RESOURCE_NOT_FOUND');
        }

        await tx.file.update({
          where: { id: file.id },
          data: {
            status: 'UPLOADED',
            uploadedAt: new Date(),
          },
        });

        const document = await tx.knowledgeDocument.create({
          data: {
            organizationId: input.organizationId,
            fileId: file.id,
            title: input.title,
            createdByMemberId: input.createdByMemberId,
            status: 'PENDING_INDEX',
          },
          include: { file: true, _count: { select: { chunks: true } } },
        });

        await createDocumentUploadedOutbox(tx, document, file);
        return toDocumentDetail(document);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  },

  async list(organizationId, input) {
    const limit = normalizeLimit(input.limit);
    const cursor = decodeCreatedAtCursor(input.cursor);
    const records = await prisma.knowledgeDocument.findMany({
      where: {
        organizationId,
        status: input.status,
        ...cursorWhere(cursor),
      },
      include: { file: true, _count: { select: { chunks: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    return toCursorPage(records.map(toDocumentDetail), limit);
  },

  async find(input) {
    const document = await prisma.knowledgeDocument.findFirst({
      where: {
        id: input.documentId,
        organizationId: input.organizationId,
      },
      include: { file: true, _count: { select: { chunks: true } } },
    });

    return document ? toDocumentDetail(document) : null;
  },

  async findIndexingTarget(input) {
    const document = await prisma.knowledgeDocument.updateMany({
      where: {
        id: input.documentId,
        organizationId: input.organizationId,
        status: { in: ['PENDING_INDEX', 'INDEX_FAILED'] },
      },
      data: {
        status: 'INDEXING',
        indexError: null,
      },
    });

    if (document.count === 0) {
      return null;
    }

    const target = await prisma.knowledgeDocument.findFirst({
      where: {
        id: input.documentId,
        organizationId: input.organizationId,
      },
      include: { file: true },
    });

    if (!target) {
      return null;
    }

    return {
      id: target.id,
      organizationId: target.organizationId,
      fileId: target.fileId,
      title: target.title,
      status: target.status,
      indexError: target.indexError,
      indexedAt: target.indexedAt,
      createdByMemberId: target.createdByMemberId,
      createdAt: target.createdAt,
      updatedAt: target.updatedAt,
      file: toFileEntity(target.file),
    };
  },

  async markPendingIndex(input) {
    await prisma.$transaction(async (tx) => {
      const document = await tx.knowledgeDocument.findFirst({
        where: {
          id: input.documentId,
          organizationId: input.organizationId,
          file: { status: 'UPLOADED' },
        },
        include: { file: true },
      });

      if (!document) {
        throw domainError('RESOURCE_NOT_FOUND');
      }

      await tx.knowledgeDocument.update({
        where: { id: document.id },
        data: {
          status: 'PENDING_INDEX',
          indexError: null,
          indexedAt: null,
        },
      });

      await createDocumentUploadedOutbox(tx, document, document.file);
    });
  },

  async replaceChunksAndMarkIndexed(input) {
    await prisma.$transaction(
      async (tx) => {
        await tx.knowledgeChunk.deleteMany({
          where: {
            organizationId: input.organizationId,
            documentId: input.documentId,
          },
        });

        for (const chunk of input.chunks) {
          await tx.$executeRaw`
            INSERT INTO "knowledge_chunks" (
              "organization_id",
              "document_id",
              "chunk_index",
              "content",
              "token_count",
              "embedding"
            )
            VALUES (
              ${input.organizationId}::uuid,
              ${input.documentId}::uuid,
              ${chunk.chunkIndex},
              ${chunk.content},
              ${chunk.tokenCount},
              ${vectorLiteral(chunk.embedding)}::vector
            )
          `;
        }

        await tx.knowledgeDocument.update({
          where: { id: input.documentId, organizationId: input.organizationId },
          data: {
            status: 'INDEXED',
            indexError: null,
            indexedAt: new Date(),
          },
        });

        await tx.outboxEvent.create({
          data: {
            organizationId: input.organizationId,
            aggregateType: 'knowledge_document',
            aggregateId: input.documentId,
            eventType: 'document.indexed',
            routingKey: 'document.indexed',
            payload: {
              organizationId: input.organizationId,
              documentId: input.documentId,
              chunkCount: input.chunks.length,
            },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  },

  async markIndexFailed(input) {
    await prisma.$transaction(async (tx) => {
      await tx.knowledgeDocument.update({
        where: { id: input.documentId, organizationId: input.organizationId },
        data: {
          status: 'INDEX_FAILED',
          indexError: input.error,
        },
      });

      await tx.outboxEvent.create({
        data: {
          organizationId: input.organizationId,
          aggregateType: 'knowledge_document',
          aggregateId: input.documentId,
          eventType: 'document.index_failed',
          routingKey: 'document.index_failed',
          payload: {
            organizationId: input.organizationId,
            documentId: input.documentId,
            error: input.error,
          },
        },
      });
    });
  },
};
