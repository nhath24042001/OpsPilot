import { describe, expect, it, vi } from 'vitest';
import { createOutboxPublisherService } from '../../src/shared/outbox/outbox-publisher.service.js';
import type { EventPublisher } from '../../src/shared/messaging/rabbitmq-publisher.js';
import type { OutboxRepository } from '../../src/shared/outbox/outbox.repository.js';

describe('outbox publisher service', () => {
  it('publishes pending events and marks them published after broker confirm', async () => {
    const event = {
      id: '11111111-1111-1111-1111-111111111111',
      organizationId: '22222222-2222-2222-2222-222222222222',
      aggregateType: 'incident',
      aggregateId: '33333333-3333-3333-3333-333333333333',
      eventType: 'incident.created',
      routingKey: 'incident.created',
      payload: { incidentId: '33333333-3333-3333-3333-333333333333' },
      status: 'PENDING' as const,
      attempts: 0,
      availableAt: new Date('2026-05-17T00:00:00.000Z'),
      publishedAt: null,
      lastError: null,
      createdAt: new Date('2026-05-17T00:00:00.000Z'),
      updatedAt: new Date('2026-05-17T00:00:00.000Z'),
    };
    const outboxRepository = {
      claimPending: vi.fn<OutboxRepository['claimPending']>().mockResolvedValueOnce([event]),
      markPublished: vi.fn<OutboxRepository['markPublished']>().mockResolvedValue(undefined),
      markFailed: vi.fn<OutboxRepository['markFailed']>().mockResolvedValue(undefined),
    };
    const eventPublisher = {
      publish: vi.fn<EventPublisher['publish']>().mockResolvedValue(undefined),
    };

    const service = createOutboxPublisherService({ outboxRepository, eventPublisher });
    const result = await service.publishPending(10);

    expect(eventPublisher.publish).toHaveBeenCalledWith(
      'incident.created',
      expect.objectContaining({
        messageId: event.id,
        eventType: 'incident.created',
        aggregateId: event.aggregateId,
      }),
    );
    expect(outboxRepository.markPublished).toHaveBeenCalledWith(event.id);
    expect(outboxRepository.markFailed).not.toHaveBeenCalled();
    expect(result).toEqual({ published: 1 });
  });
});
