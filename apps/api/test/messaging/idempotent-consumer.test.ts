import { describe, expect, it, vi } from 'vitest';
import { createIdempotentConsumer } from '../../src/shared/messaging/idempotent-consumer.js';
import type { ProcessedMessageRepository } from '../../src/shared/messaging/processed-message.repository.js';
import type { OutboxPublishMessage } from '../../src/shared/outbox/outbox-event.js';

describe('idempotent consumer', () => {
  const message: OutboxPublishMessage = {
    messageId: 'message-1',
    eventType: 'incident.created',
    aggregateType: 'incident',
    aggregateId: '11111111-1111-1111-1111-111111111111',
    organizationId: '22222222-2222-2222-2222-222222222222',
    payload: { incidentId: '11111111-1111-1111-1111-111111111111' },
    occurredAt: '2026-05-17T00:00:00.000Z',
  };

  it('processes first delivery and skips duplicates', async () => {
    const tryStart = vi
      .fn<ProcessedMessageRepository['tryStart']>()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const clear = vi.fn<ProcessedMessageRepository['clear']>().mockResolvedValue(undefined);
    const handler = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const consumer = createIdempotentConsumer({
      consumerName: 'test-consumer',
      processedMessageRepository: { tryStart, clear },
      handler,
    });

    await consumer(message);
    await consumer(message);

    expect(tryStart).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(clear).not.toHaveBeenCalled();
  });

  it('clears the processed marker when handling fails so RabbitMQ can retry', async () => {
    const tryStart = vi.fn<ProcessedMessageRepository['tryStart']>().mockResolvedValueOnce(true);
    const clear = vi.fn<ProcessedMessageRepository['clear']>().mockResolvedValue(undefined);
    const handler = vi.fn<() => Promise<void>>().mockRejectedValue(new Error('handler failed'));
    const consumer = createIdempotentConsumer({
      consumerName: 'test-consumer',
      processedMessageRepository: { tryStart, clear },
      handler,
    });

    await expect(consumer(message)).rejects.toThrow('handler failed');

    expect(clear).toHaveBeenCalledWith({
      messageId: message.messageId,
      consumerName: 'test-consumer',
    });
  });
});
