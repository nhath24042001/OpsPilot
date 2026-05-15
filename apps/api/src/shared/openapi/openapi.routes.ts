import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './openapi.js';

export const openApiRoutes = Router();

openApiRoutes.get('/openapi.json', (_req, res) => {
  res.status(200).json(openApiDocument);
});

openApiRoutes.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
