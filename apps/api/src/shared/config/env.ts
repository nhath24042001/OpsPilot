import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.string().default('info'),
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://opspilot:opspilot@localhost:5432/opspilot?schema=public'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  RABBITMQ_URL: z.string().min(1).default('amqp://opspilot:opspilot@localhost:5672'),
  MINIO_ENDPOINT: z.string().url().default('http://localhost:9000'),
  MINIO_REGION: z.string().default('us-east-1'),
  MINIO_ACCESS_KEY: z.string().min(1).default('opspilot'),
  MINIO_SECRET_KEY: z.string().min(1).default('opspilot-secret'),
  MINIO_BUCKET: z.string().min(1).default('opspilot'),
  JWT_ACCESS_SECRET: z.string().min(16).default('local-access-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().min(16).default('local-refresh-secret-change-me'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  OAUTH_GOOGLE_CLIENT_ID: z.string().optional().default(''),
  OAUTH_GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  OAUTH_GOOGLE_CALLBACK_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);
