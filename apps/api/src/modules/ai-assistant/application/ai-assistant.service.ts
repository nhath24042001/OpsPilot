import type { createAskKnowledgeBaseUseCase } from './use-cases/ask-knowledge-base.use-case.js';
import type { createGeneratePostmortemUseCase } from './use-cases/generate-postmortem.use-case.js';
import type { createRecommendRunbooksUseCase } from './use-cases/recommend-runbooks.use-case.js';

export type AiAssistantUseCases = {
  askKnowledgeBase: ReturnType<typeof createAskKnowledgeBaseUseCase>;
  recommendRunbooks: ReturnType<typeof createRecommendRunbooksUseCase>;
  generatePostmortem: ReturnType<typeof createGeneratePostmortemUseCase>;
};

export const createAiAssistantService = (useCases: AiAssistantUseCases) => ({
  ask: useCases.askKnowledgeBase.execute.bind(useCases.askKnowledgeBase),
  recommendRunbooks: useCases.recommendRunbooks.execute.bind(useCases.recommendRunbooks),
  generatePostmortem: useCases.generatePostmortem.execute.bind(useCases.generatePostmortem),
});
