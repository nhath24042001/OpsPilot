import { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma.js';

export interface ProcessedMessageRepository {
  tryStart(input: { messageId: string; consumerName: string }): Promise<boolean>;
  clear(input: { messageId: string; consumerName: string }): Promise<void>;
}

export const prismaProcessedMessageRepository: ProcessedMessageRepository = {
  async tryStart(input) {
    try {
      await prisma.processedMessage.create({
        data: {
          messageId: input.messageId,
          consumerName: input.consumerName,
        },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return false;
      }

      throw error;
    }
  },

  async clear(input) {
    await prisma.processedMessage.deleteMany({
      where: {
        messageId: input.messageId,
        consumerName: input.consumerName,
      },
    });
  },
};
