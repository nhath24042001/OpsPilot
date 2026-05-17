import { getRabbitMqConnection } from '../rabbitmq/rabbitmq.js';
import { OPSPILOT_EVENTS_EXCHANGE } from './rabbitmq-topology.js';
import type { OutboxPublishMessage } from '../outbox/outbox-event.js';

export interface EventPublisher {
  publish(routingKey: string, message: OutboxPublishMessage): Promise<void>;
}

export const rabbitMqEventPublisher: EventPublisher = {
  async publish(routingKey, message) {
    const connection = await getRabbitMqConnection();
    const channel = await connection.createConfirmChannel();

    try {
      await channel.assertExchange(OPSPILOT_EVENTS_EXCHANGE, 'topic', { durable: true });
      const published = channel.publish(
        OPSPILOT_EVENTS_EXCHANGE,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        {
          contentType: 'application/json',
          deliveryMode: 2,
          messageId: message.messageId,
          type: message.eventType,
          timestamp: Math.floor(Date.now() / 1000),
        },
      );

      if (!published) {
        await new Promise<void>((resolve) => channel.once('drain', resolve));
      }

      await channel.waitForConfirms();
    } finally {
      await channel.close();
    }
  },
};
