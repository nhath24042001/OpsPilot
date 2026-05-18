import type { ConsumeMessage } from 'amqplib';
import { knowledgeBaseModule } from '../../modules/knowledge-base/knowledge-base.module.js';
import { logger } from '../logger/logger.js';
import type { OutboxPublishMessage } from '../outbox/outbox-event.js';
import { getRabbitMqConnection } from '../rabbitmq/rabbitmq.js';
import { createIdempotentConsumer } from './idempotent-consumer.js';
import { prismaProcessedMessageRepository } from './processed-message.repository.js';
import {
  OPSPILOT_EVENTS_EXCHANGE,
  QUEUES,
  ROUTING_KEYS,
} from './rabbitmq-topology.js';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isDocumentUploadedMessage = (value: unknown): value is OutboxPublishMessage => {
  if (!isObject(value)) {
    return false;
  }

  const payload = value['payload'];
  return (
    value['eventType'] === 'document.uploaded' &&
    typeof value['messageId'] === 'string' &&
    typeof value['aggregateId'] === 'string' &&
    typeof value['organizationId'] === 'string' &&
    isObject(payload) &&
    typeof payload['documentId'] === 'string'
  );
};

const parseMessage = (message: ConsumeMessage): OutboxPublishMessage => {
  const parsed = JSON.parse(message.content.toString()) as unknown;
  if (!isDocumentUploadedMessage(parsed)) {
    throw new Error('Invalid document.uploaded message');
  }

  return parsed;
};

export const startDocumentIndexingConsumer = async (): Promise<() => Promise<void>> => {
  const connection = await getRabbitMqConnection();
  const channel = await connection.createChannel();
  const handler = createIdempotentConsumer({
    consumerName: 'document-indexing',
    processedMessageRepository: prismaProcessedMessageRepository,
    handler: async (message) => {
      if (!message.organizationId || !isObject(message.payload)) {
        throw new Error('document.uploaded message is missing organization or payload');
      }

      const documentId = message.payload['documentId'];
      if (typeof documentId !== 'string') {
        throw new Error('document.uploaded message is missing documentId');
      }

      await knowledgeBaseModule.knowledgeBaseService.indexDocument({
        organizationId: message.organizationId,
        documentId,
      });
    },
  });

  await channel.assertExchange(OPSPILOT_EVENTS_EXCHANGE, 'topic', { durable: true });
  await channel.assertQueue(QUEUES.documentExtract, { durable: true });
  await channel.bindQueue(
    QUEUES.documentExtract,
    OPSPILOT_EVENTS_EXCHANGE,
    ROUTING_KEYS.documentUploaded,
  );
  await channel.prefetch(5);

  await channel.consume(QUEUES.documentExtract, (raw) => {
    void (async () => {
      if (!raw) {
        return;
      }

      try {
        await handler(parseMessage(raw));
        channel.ack(raw);
      } catch (error) {
        logger.error({ err: error }, 'Document indexing consumer failed');
        channel.nack(raw, false, true);
      }
    })();
  });

  return async () => {
    await channel.close();
  };
};
