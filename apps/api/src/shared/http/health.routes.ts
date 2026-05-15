import { Router } from 'express';
import { checkPrisma } from '../database/prisma.js';
import { checkRedis } from '../redis/redis.js';
import { checkRabbitMq } from '../rabbitmq/rabbitmq.js';
import { checkMinio } from '../storage/minio.js';
import { asyncHandler } from './async-handler.js';

export const healthRoutes = Router();

healthRoutes.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

healthRoutes.get(
  '/ready',
  asyncHandler(async (_req, res) => {
    const checks = {
      postgres: await checkPrisma(),
      redis: await checkRedis(),
      rabbitmq: await checkRabbitMq(),
      minio: await checkMinio(),
    };

    const ready = Object.values(checks).every(Boolean);
    res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready', checks });
  }),
);
