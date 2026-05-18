import { prisma } from '../../../../shared/database/prisma.js';
import type { RagSource } from '../../domain/entities/rag-source.entity.js';
import type { RagRepository } from '../../domain/repositories/rag.repository.js';

type RagRow = {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  content: string;
  score: number;
};

const vectorLiteral = (embedding: readonly number[]): string => {
  if (embedding.length !== 8 || embedding.some((value) => !Number.isFinite(value))) {
    throw new Error('Embedding must contain exactly 8 finite numbers');
  }

  return `[${embedding.map((value) => value.toFixed(6)).join(',')}]`;
};

export const prismaRagRepository: RagRepository = {
  async search(input) {
    const rows = await prisma.$queryRaw<RagRow[]>`
      SELECT
        kc."id" AS "chunkId",
        kd."id" AS "documentId",
        kd."title" AS "documentTitle",
        kc."chunk_index" AS "chunkIndex",
        kc."content" AS "content",
        (1 - (kc."embedding" <=> ${vectorLiteral(input.embedding)}::vector))::float8 AS "score"
      FROM "knowledge_chunks" kc
      INNER JOIN "knowledge_documents" kd ON kd."id" = kc."document_id"
      WHERE kc."organization_id" = ${input.organizationId}::uuid
        AND kd."organization_id" = ${input.organizationId}::uuid
        AND kd."status" = 'INDEXED'
      ORDER BY kc."embedding" <=> ${vectorLiteral(input.embedding)}::vector ASC
      LIMIT ${input.limit}
    `;

    return rows.map(
      (row): RagSource => ({
        chunkId: row.chunkId,
        documentId: row.documentId,
        documentTitle: row.documentTitle,
        chunkIndex: row.chunkIndex,
        content: row.content,
        score: Number(row.score.toFixed(6)),
      }),
    );
  },
};
