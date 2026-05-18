import { domainError } from '../../../../shared/errors/app-error.js';
import type { EmbeddingProviderPort } from '../../../knowledge-base/application/ports/embedding-provider.port.js';
import type { LlmProviderPort } from '../ports/llm-provider.port.js';
import type { RateLimiterPort } from '../ports/rate-limiter.port.js';
import type { AssistantConversationRepository } from '../../domain/repositories/assistant-conversation.repository.js';
import type { RagRepository } from '../../domain/repositories/rag.repository.js';
import { buildKnowledgePrompt, toAssistantSources } from '../services/rag-prompt.js';

const AI_ASK_LIMIT = 20;
const AI_ASK_WINDOW_SECONDS = 60;
const DEFAULT_TOP_K = 5;

type Deps = {
  embeddingProvider: EmbeddingProviderPort;
  ragRepository: RagRepository;
  llmProvider: LlmProviderPort;
  assistantConversationRepository: AssistantConversationRepository;
  rateLimiter: RateLimiterPort;
};

type Input = {
  organizationId: string;
  userId: string;
  question: string;
  topK?: number;
};

export const createAskKnowledgeBaseUseCase = (deps: Deps) => ({
  async execute(input: Input) {
    const rateLimit = await deps.rateLimiter.consume({
      key: `rate:ai:${input.organizationId}:${input.userId}`,
      limit: AI_ASK_LIMIT,
      windowSeconds: AI_ASK_WINDOW_SECONDS,
    });

    if (!rateLimit.allowed) {
      throw domainError('RATE_LIMIT_EXCEEDED', { resetAt: rateLimit.resetAt });
    }

    const embedding = await deps.embeddingProvider.embed(input.question);
    const sources = await deps.ragRepository.search({
      organizationId: input.organizationId,
      embedding,
      limit: input.topK ?? DEFAULT_TOP_K,
    });
    const assistantSources = toAssistantSources(sources);
    const answer = await deps.llmProvider.complete({
      system:
        'You are OpsPilot RAG assistant. Answer only from provided context and mention uncertainty when context is thin.',
      prompt: buildKnowledgePrompt({ question: input.question, sources }),
    });
    const saved = await deps.assistantConversationRepository.save({
      organizationId: input.organizationId,
      userId: input.userId,
      question: input.question,
      answer,
      sources: assistantSources,
    });

    return {
      answer,
      sources: assistantSources,
      conversationId: saved.conversationId,
      rateLimit,
    };
  },
});
