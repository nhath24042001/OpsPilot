import { Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/database/prisma.js';
import type { AssistantConversationRepository } from '../../domain/repositories/assistant-conversation.repository.js';

export const prismaAssistantConversationRepository: AssistantConversationRepository = {
  async save(input) {
    const conversation = await prisma.assistantConversation.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        question: input.question,
        answer: input.answer,
        sources: input.sources as Prisma.InputJsonValue,
        messages: {
          create: [
            {
              role: 'USER',
              content: input.question,
            },
            {
              role: 'ASSISTANT',
              content: input.answer,
            },
          ],
        },
      },
      select: { id: true },
    });

    return { conversationId: conversation.id };
  },
};
