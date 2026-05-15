import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/shared/http/app.js';

describe('health', () => {
  it('returns 200 for health endpoint', async () => {
    const app = createApp();

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
