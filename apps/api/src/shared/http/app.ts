import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { accessControlRoutes } from '../../modules/access-control/presentation/access-control.routes.js';
import { authRoutes } from '../../modules/identity/presentation/auth.routes.js';
import { incidentTimelineRoutes } from '../../modules/incident-timeline/presentation/incident-timeline.routes.js';
import { incidentRoutes } from '../../modules/incidents/presentation/incident.routes.js';
import { knowledgeBaseRoutes } from '../../modules/knowledge-base/presentation/knowledge-base.routes.js';
import { organizationRoutes } from '../../modules/organizations/presentation/organization.routes.js';
import { serviceCatalogRoutes } from '../../modules/service-catalog/presentation/service-catalog.routes.js';
import { env } from '../config/env.js';
import { logger } from '../logger/logger.js';
import { openApiRoutes } from '../openapi/openapi.routes.js';
import { errorHandler } from './error-handler.js';
import { healthRoutes } from './health.routes.js';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.ALLOWED_ORIGINS, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(pinoHttp({ logger }));

  app.use(openApiRoutes);
  app.use(healthRoutes);
  app.use('/auth', authRoutes);
  app.use(organizationRoutes);
  app.use(accessControlRoutes);
  app.use(serviceCatalogRoutes);
  app.use(incidentRoutes);
  app.use(incidentTimelineRoutes);
  app.use(knowledgeBaseRoutes);

  app.use(errorHandler);

  return app;
};
