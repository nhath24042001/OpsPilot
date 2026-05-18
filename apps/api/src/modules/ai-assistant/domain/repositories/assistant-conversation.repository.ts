import type { AssistantSource } from '../entities/rag-source.entity.js';

export interface AssistantConversationRepository {
  save(input: {
    organizationId: string;
    userId: string;
    question: string;
    answer: string;
    sources: readonly AssistantSource[];
  }): Promise<{ conversationId: string }>;
}
