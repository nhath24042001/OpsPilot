import type { RagSource } from '../entities/rag-source.entity.js';

export interface RagRepository {
  search(input: {
    organizationId: string;
    embedding: readonly number[];
    limit: number;
  }): Promise<RagSource[]>;
}
