import { describe, expect, it, vi } from 'vitest';
import { createRecommendRunbooksUseCase } from '../../src/modules/ai-assistant/application/use-cases/recommend-runbooks.use-case.js';
import type { RagRepository } from '../../src/modules/ai-assistant/domain/repositories/rag.repository.js';
import type { PostmortemRepository } from '../../src/modules/ai-assistant/domain/repositories/postmortem.repository.js';
import type { EmbeddingProviderPort } from '../../src/modules/knowledge-base/application/ports/embedding-provider.port.js';

describe('recommend runbooks use case', () => {
  it('uses incident context as a tenant-scoped RAG query', async () => {
    const embeddingProvider = {
      dimensions: 8,
      embed: vi.fn<EmbeddingProviderPort['embed']>().mockResolvedValue([0, 1, 0, 0, 0, 0, 0, 0]),
    };
    const ragRepository = {
      search: vi.fn<RagRepository['search']>().mockResolvedValue([
        {
          documentId: 'document-1',
          documentTitle: 'SEV1 Auth Runbook',
          chunkId: 'chunk-1',
          chunkIndex: 2,
          content: 'Check token issuer errors.',
          score: 0.87,
        },
      ]),
    };
    const postmortemRepository = {
      findIncident: vi.fn<PostmortemRepository['findIncident']>().mockResolvedValue({
        id: 'incident-1',
        organizationId: 'org-1',
        title: 'Auth outage',
        description: 'Login API failing',
        severity: 'SEV1',
        status: 'OPEN',
        rootCause: null,
        resolution: null,
        serviceName: 'auth-service',
        createdAt: new Date('2026-05-18T00:00:00.000Z'),
        resolvedAt: null,
        timelineEvents: [],
        comments: [],
      }),
    } as Pick<PostmortemRepository, 'findIncident'> as PostmortemRepository;

    const useCase = createRecommendRunbooksUseCase({
      embeddingProvider,
      ragRepository,
      postmortemRepository,
    });
    const result = await useCase.execute({
      organizationId: 'org-1',
      incidentId: 'incident-1',
      topK: 4,
    });

    expect(embeddingProvider.embed).toHaveBeenCalledWith(
      expect.stringContaining('auth-service'),
    );
    expect(ragRepository.search).toHaveBeenCalledWith({
      organizationId: 'org-1',
      embedding: [0, 1, 0, 0, 0, 0, 0, 0],
      limit: 4,
    });
    expect(result.recommendations).toEqual([
      {
        documentId: 'document-1',
        title: 'SEV1 Auth Runbook',
        chunkId: 'chunk-1',
        score: 0.87,
      },
    ]);
  });
});
