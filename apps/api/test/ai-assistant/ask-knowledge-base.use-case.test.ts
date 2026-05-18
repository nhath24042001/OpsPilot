import { describe, expect, it, vi } from 'vitest';
import { createAskKnowledgeBaseUseCase } from '../../src/modules/ai-assistant/application/use-cases/ask-knowledge-base.use-case.js';
import type { RateLimiterPort } from '../../src/modules/ai-assistant/application/ports/rate-limiter.port.js';
import type { LlmProviderPort } from '../../src/modules/ai-assistant/application/ports/llm-provider.port.js';
import type { AssistantConversationRepository } from '../../src/modules/ai-assistant/domain/repositories/assistant-conversation.repository.js';
import type { RagRepository } from '../../src/modules/ai-assistant/domain/repositories/rag.repository.js';
import type { EmbeddingProviderPort } from '../../src/modules/knowledge-base/application/ports/embedding-provider.port.js';

describe('ask knowledge base use case', () => {
  const rateLimit = {
    allowed: true,
    remaining: 19,
    resetAt: new Date('2026-05-18T00:01:00.000Z'),
  };

  it('embeds the question, searches current organization chunks, returns sources, and saves conversation', async () => {
    const embeddingProvider = {
      dimensions: 8,
      embed: vi.fn<EmbeddingProviderPort['embed']>().mockResolvedValue([1, 0, 0, 0, 0, 0, 0, 0]),
    };
    const ragRepository = {
      search: vi.fn<RagRepository['search']>().mockResolvedValue([
        {
          documentId: 'document-1',
          documentTitle: 'RabbitMQ Runbook',
          chunkId: 'chunk-1',
          chunkIndex: 0,
          content: 'Restart the delayed consumer after checking queue lag.',
          score: 0.91,
        },
      ]),
    };
    const llmProvider = {
      complete: vi.fn<LlmProviderPort['complete']>().mockResolvedValue('Check queue lag first.'),
    };
    const assistantConversationRepository = {
      save: vi
        .fn<AssistantConversationRepository['save']>()
        .mockResolvedValue({ conversationId: 'conversation-1' }),
    };
    const rateLimiter = {
      consume: vi.fn<RateLimiterPort['consume']>().mockResolvedValue(rateLimit),
    };

    const useCase = createAskKnowledgeBaseUseCase({
      embeddingProvider,
      ragRepository,
      llmProvider,
      assistantConversationRepository,
      rateLimiter,
    });

    const result = await useCase.execute({
      organizationId: '11111111-1111-1111-1111-111111111111',
      userId: 'user-1',
      question: 'How do I handle RabbitMQ lag?',
      topK: 3,
    });

    expect(ragRepository.search).toHaveBeenCalledWith({
      organizationId: '11111111-1111-1111-1111-111111111111',
      embedding: [1, 0, 0, 0, 0, 0, 0, 0],
      limit: 3,
    });
    expect(assistantConversationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: '11111111-1111-1111-1111-111111111111',
        userId: 'user-1',
        question: 'How do I handle RabbitMQ lag?',
        answer: 'Check queue lag first.',
      }),
    );
    expect(result.sources).toEqual([
      {
        documentId: 'document-1',
        title: 'RabbitMQ Runbook',
        chunkId: 'chunk-1',
        score: 0.91,
      },
    ]);
    expect(result.conversationId).toBe('conversation-1');
  });

  it('blocks when the AI rate limit is exceeded', async () => {
    const useCase = createAskKnowledgeBaseUseCase({
      embeddingProvider: { dimensions: 8, embed: vi.fn() },
      ragRepository: { search: vi.fn() },
      llmProvider: { complete: vi.fn() },
      assistantConversationRepository: { save: vi.fn() },
      rateLimiter: {
        consume: vi.fn<RateLimiterPort['consume']>().mockResolvedValue({
          allowed: false,
          remaining: 0,
          resetAt: new Date('2026-05-18T00:01:00.000Z'),
        }),
      },
    });

    await expect(
      useCase.execute({
        organizationId: 'org-1',
        userId: 'user-1',
        question: 'What happened?',
      }),
    ).rejects.toMatchObject({ code: 'RATE_LIMIT_EXCEEDED', statusCode: 429 });
  });
});
