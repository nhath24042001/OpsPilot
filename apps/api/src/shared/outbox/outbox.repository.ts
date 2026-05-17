import { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma.js';
import type { OutboxEventEntity } from './outbox-event.js';

export interface OutboxRepository {
  claimPending(batchSize: number): Promise<OutboxEventEntity[]>;
  markPublished(eventId: string): Promise<void>;
  markFailed(input: { eventId: string; error: string; retryAfterMs: number }): Promise<void>;
}

export const prismaOutboxRepository: OutboxRepository = {
  async claimPending(batchSize: number) {
    return prisma.$transaction(
      async (tx) => {
        const events = await tx.outboxEvent.findMany({
          where: {
            status: { in: ['PENDING', 'FAILED'] },
            availableAt: { lte: new Date() },
          },
          orderBy: [{ createdAt: 'asc' }],
          take: batchSize,
        });

        if (events.length === 0) {
          return [];
        }

        await tx.outboxEvent.updateMany({
          where: { id: { in: events.map((event) => event.id) } },
          data: {
            status: 'PROCESSING',
            attempts: { increment: 1 },
          },
        });

        return events;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  },

  async markPublished(eventId: string) {
    await prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        lastError: null,
      },
    });
  },

  async markFailed(input) {
    await prisma.outboxEvent.update({
      where: { id: input.eventId },
      data: {
        status: 'FAILED',
        lastError: input.error,
        availableAt: new Date(Date.now() + input.retryAfterMs),
      },
    });
  },
};
