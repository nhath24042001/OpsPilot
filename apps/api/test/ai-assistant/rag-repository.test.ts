import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('RAG repository implementation', () => {
  it('keeps pgvector search scoped by organization', () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        'src/modules/ai-assistant/infrastructure/prisma/prisma-rag.repository.ts',
      ),
      'utf8',
    );

    expect(source).toContain('WHERE kc."organization_id" = ${input.organizationId}::uuid');
    expect(source).toContain('AND kd."organization_id" = ${input.organizationId}::uuid');
    expect(source).toContain('AND kd."status" = \'INDEXED\'');
  });
});
