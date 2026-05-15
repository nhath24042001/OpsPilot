import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/shared/http/app.js';

describe('openapi', () => {
  it('returns the OpenAPI document', async () => {
    const app = createApp();

    const response = await request(app).get('/openapi.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.1.0');
    expect(response.body.info.title).toBe('OpsPilot API');
  });
});
