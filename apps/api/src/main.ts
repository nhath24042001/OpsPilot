import { createServer } from 'node:http';
import { createApp } from './shared/http/app.js';
import { env } from './shared/config/env.js';
import { logger } from './shared/logger/logger.js';
import { closePrisma } from './shared/database/prisma.js';
import { closeRedis } from './shared/redis/redis.js';
import { closeRabbitMq } from './shared/rabbitmq/rabbitmq.js';

const app = createApp();
const server = createServer(app);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'API server started');
});

const shutdown = (signal: string) => {
  logger.info({ signal }, 'Shutting down API server');
  server.close(() => {
    void (async () => {
      closeRedis();
      await Promise.allSettled([closePrisma(), closeRabbitMq()]);
      process.exit(0);
    })();
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
