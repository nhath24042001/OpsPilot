import { deterministicEmbeddingProvider } from '../knowledge-base/infrastructure/llm/deterministic-embedding-provider.js';
import { createAiAssistantService } from './application/ai-assistant.service.js';
import { createAskKnowledgeBaseUseCase } from './application/use-cases/ask-knowledge-base.use-case.js';
import { createGeneratePostmortemUseCase } from './application/use-cases/generate-postmortem.use-case.js';
import { createRecommendRunbooksUseCase } from './application/use-cases/recommend-runbooks.use-case.js';
import { mockLlmProvider } from './infrastructure/llm/mock-llm-provider.js';
import { prismaAssistantConversationRepository } from './infrastructure/prisma/prisma-assistant-conversation.repository.js';
import { prismaPostmortemRepository } from './infrastructure/prisma/prisma-postmortem.repository.js';
import { prismaRagRepository } from './infrastructure/prisma/prisma-rag.repository.js';
import { redisRateLimiter } from './infrastructure/redis/redis-rate-limiter.js';

export const createAiAssistantModule = () => {
  const embeddingProvider = deterministicEmbeddingProvider;
  const ragRepository = prismaRagRepository;
  const llmProvider = mockLlmProvider;
  const assistantConversationRepository = prismaAssistantConversationRepository;
  const postmortemRepository = prismaPostmortemRepository;
  const rateLimiter = redisRateLimiter;
  const useCases = {
    askKnowledgeBase: createAskKnowledgeBaseUseCase({
      embeddingProvider,
      ragRepository,
      llmProvider,
      assistantConversationRepository,
      rateLimiter,
    }),
    recommendRunbooks: createRecommendRunbooksUseCase({
      embeddingProvider,
      ragRepository,
      postmortemRepository,
    }),
    generatePostmortem: createGeneratePostmortemUseCase({
      postmortemRepository,
      llmProvider,
    }),
  };

  return {
    aiAssistantService: createAiAssistantService(useCases),
    ragRepository,
    postmortemRepository,
  };
};

export const aiAssistantModule = createAiAssistantModule();
