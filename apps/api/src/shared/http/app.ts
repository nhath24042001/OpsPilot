import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { authRoutes } from '../../modules/identity/presentation/auth.routes.js';
import { organizationRoutes } from '../../modules/organizations/presentation/organization.routes.js';
import { logger } from '../logger/logger.js';
import { openApiRoutes } from '../openapi/openapi.routes.js';
import { errorHandler } from './error-handler.js';
import { healthRoutes } from './health.routes.js';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger }));

  app.use(openApiRoutes);
  app.use(healthRoutes);
  app.use('/auth', authRoutes);
  app.use(organizationRoutes);

  app.use(errorHandler);

  return app;
};
