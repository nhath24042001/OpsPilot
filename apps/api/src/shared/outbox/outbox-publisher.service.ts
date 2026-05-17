import { logger } from '../logger/logger.js';
import type { EventPublisher } from '../messaging/rabbitmq-publisher.js';
import type { OutboxRepository } from './outbox.repository.js';
import type { OutboxPublishMessage } from './outbox-event.js';

type Deps = {
  outboxRepository: OutboxRepository;
  eventPublisher: EventPublisher;
};

export const createOutboxPublisherService = (deps: Deps) => ({
  async publishPending(batchSize = 50) {
    const events = await deps.outboxRepository.claimPending(batchSize);

    for (const event of events) {
      const message: OutboxPublishMessage = {
        messageId: event.id,
        eventType: event.eventType,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        organizationId: event.organizationId,
        payload: event.payload,
        occurredAt: event.createdAt.toISOString(),
      };

      try {
        await deps.eventPublisher.publish(event.routingKey, message);
        await deps.outboxRepository.markPublished(event.id);
      } catch (error) {
        const messageText = error instanceof Error ? error.message : 'Unknown publish error';
        logger.error({ err: error, outboxEventId: event.id }, 'Failed to publish outbox event');
        await deps.outboxRepository.markFailed({
          eventId: event.id,
          error: messageText,
          retryAfterMs: Math.min(60_000, 1000 * 2 ** event.attempts),
        });
      }
    }

    return { published: events.length };
  },
});
