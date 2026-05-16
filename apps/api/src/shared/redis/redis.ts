import { Redis } from 'ioredis';
import { env } from '../config/env.js';

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

export const checkRedis = async () => {
  try {
    if (redis.status === 'wait') {
      await redis.connect();
    }
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
};

export const closeRedis = () => {
  if (redis.status !== 'end') {
    redis.disconnect();
  }
};
