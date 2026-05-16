import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '../src/shared/http/app.js';

const openApiDocumentSchema = z.object({
  openapi: z.string(),
  info: z.object({
    title: z.string(),
  }),
});

describe('openapi', () => {
  it('returns the OpenAPI document', async () => {
    const app = createApp();

    const response = await request(app).get('/openapi.json');
    const body = openApiDocumentSchema.parse(response.body);

    expect(response.status).toBe(200);
    expect(body.openapi).toBe('3.1.0');
    expect(body.info.title).toBe('OpsPilot API');
  });
});
