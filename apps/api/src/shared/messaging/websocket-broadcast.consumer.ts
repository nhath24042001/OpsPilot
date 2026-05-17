import type { ConsumeMessage } from 'amqplib';
import { getRabbitMqConnection } from '../rabbitmq/rabbitmq.js';
import { broadcastIncidentEvent } from '../websocket/incident-websocket-server.js';
import type { OutboxPublishMessage } from '../outbox/outbox-event.js';
import { createIdempotentConsumer } from './idempotent-consumer.js';
import { prismaProcessedMessageRepository } from './processed-message.repository.js';
import {
  OPSPILOT_EVENTS_EXCHANGE,
  QUEUES,
  ROUTING_KEYS,
} from './rabbitmq-topology.js';
import { logger } from '../logger/logger.js';

const isOutboxPublishMessage = (value: unknown): value is OutboxPublishMessage => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['messageId'] === 'string' &&
    typeof candidate['eventType'] === 'string' &&
    typeof candidate['aggregateType'] === 'string' &&
    typeof candidate['aggregateId'] === 'string' &&
    typeof candidate['occurredAt'] === 'string' &&
    'payload' in candidate
  );
};

const parseMessage = (message: ConsumeMessage): OutboxPublishMessage => {
  const parsed = JSON.parse(message.content.toString()) as unknown;
  if (!isOutboxPublishMessage(parsed)) {
    throw new Error('Invalid outbox publish message');
  }

  return parsed;
};

export const startWebsocketBroadcastConsumer = async (): Promise<() => Promise<void>> => {
  const connection = await getRabbitMqConnection();
  const channel = await connection.createChannel();
  const handler = createIdempotentConsumer({
    consumerName: 'websocket-broadcast',
    processedMessageRepository: prismaProcessedMessageRepository,
    handler: (message) => {
      broadcastIncidentEvent(message);
      return Promise.resolve();
    },
  });

  await channel.assertExchange(OPSPILOT_EVENTS_EXCHANGE, 'topic', { durable: true });
  await channel.assertQueue(QUEUES.websocketBroadcast, { durable: true });
  await channel.bindQueue(
    QUEUES.websocketBroadcast,
    OPSPILOT_EVENTS_EXCHANGE,
    ROUTING_KEYS.incidentAll,
  );
  await channel.prefetch(20);

  await channel.consume(QUEUES.websocketBroadcast, (raw) => {
    void (async () => {
      if (!raw) {
        return;
      }

      try {
        await handler(parseMessage(raw));
        channel.ack(raw);
      } catch (error) {
        logger.error({ err: error }, 'WebSocket broadcast consumer failed');
        channel.nack(raw, false, true);
      }
    })();
  });

  return async () => {
    await channel.close();
  };
};
