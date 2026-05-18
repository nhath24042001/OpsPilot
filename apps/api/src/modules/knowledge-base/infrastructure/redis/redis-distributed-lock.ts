import { randomUUID } from 'node:crypto';
import { redis } from '../../../../shared/redis/redis.js';
import type {
  AcquiredLock,
  DistributedLockPort,
} from '../../application/ports/distributed-lock.port.js';

const RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0
`;

export const redisDistributedLock: DistributedLockPort = {
  async acquire(input) {
    const token = randomUUID();
    const result = await redis.set(input.key, token, 'PX', input.ttlMs, 'NX');
    if (result !== 'OK') {
      return null;
    }

    return { key: input.key, token };
  },

  async release(lock: AcquiredLock) {
    await redis.eval(RELEASE_SCRIPT, 1, lock.key, lock.token);
  },
};
