import { createServer } from 'node:http';
import { createApp } from './shared/http/app.js';
import { env } from './shared/config/env.js';
import { logger } from './shared/logger/logger.js';
import { closePrisma } from './shared/database/prisma.js';
import { closeRedis } from './shared/redis/redis.js';
import { closeRabbitMq } from './shared/rabbitmq/rabbitmq.js';
import { startWebsocketBroadcastConsumer } from './shared/messaging/websocket-broadcast.consumer.js';
import { rabbitMqEventPublisher } from './shared/messaging/rabbitmq-publisher.js';
import { createOutboxPublisherService } from './shared/outbox/outbox-publisher.service.js';
import { prismaOutboxRepository } from './shared/outbox/outbox.repository.js';
import {
  attachIncidentWebSocketServer,
  closeIncidentWebSocketServer,
} from './shared/websocket/incident-websocket-server.js';

const app = createApp();
const server = createServer(app);
attachIncidentWebSocketServer(server);

const outboxPublisher = createOutboxPublisherService({
  outboxRepository: prismaOutboxRepository,
  eventPublisher: rabbitMqEventPublisher,
});

const outboxInterval = setInterval(() => {
  void outboxPublisher.publishPending();
}, 5000);

let closeWebsocketConsumer: (() => Promise<void>) | null = null;

void startWebsocketBroadcastConsumer()
  .then((closeConsumer) => {
    closeWebsocketConsumer = closeConsumer;
  })
  .catch((error: unknown) => {
    logger.error({ err: error }, 'Failed to start websocket broadcast consumer');
  });

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'API server started');
});

const shutdown = (signal: string) => {
  logger.info({ signal }, 'Shutting down API server');
  clearInterval(outboxInterval);
  server.close(() => {
    void (async () => {
      closeRedis();
      await Promise.allSettled([
        closeWebsocketConsumer?.() ?? Promise.resolve(),
        closeIncidentWebSocketServer(),
        closePrisma(),
        closeRabbitMq(),
      ]);
      process.exit(0);
    })();
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
