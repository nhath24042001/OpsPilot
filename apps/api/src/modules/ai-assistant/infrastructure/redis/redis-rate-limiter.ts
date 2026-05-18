import { redis } from '../../../../shared/redis/redis.js';
import type { RateLimiterPort } from '../../application/ports/rate-limiter.port.js';

export const redisRateLimiter: RateLimiterPort = {
  async consume(input) {
    const count = await redis.incr(input.key);
    if (count === 1) {
      await redis.expire(input.key, input.windowSeconds);
    }

    const ttl = await redis.ttl(input.key);
    const resetAt = new Date(Date.now() + Math.max(ttl, 0) * 1000);
    const remaining = Math.max(input.limit - count, 0);

    return {
      allowed: count <= input.limit,
      remaining,
      resetAt,
    };
  },
};
