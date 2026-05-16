import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  permissionCacheKey,
  redisPermissionCache,
} from '../../src/modules/access-control/infrastructure/redis/redis-permission-cache.js';

const redisMock = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

vi.mock('../../src/shared/redis/redis.js', () => ({
  redis: redisMock,
}));

describe('redisPermissionCache', () => {
  const organizationId = '11111111-1111-1111-1111-111111111111';
  const userId = '22222222-2222-2222-2222-222222222222';
  const memberId = '33333333-3333-4333-8333-333333333333';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses stable tenant permission cache keys', () => {
    expect(permissionCacheKey({ organizationId, userId })).toBe(
      `org:${organizationId}:user:${userId}:permissions`,
    );
  });

  it('returns cached permissions from valid JSON', async () => {
    redisMock.get.mockResolvedValueOnce(
      JSON.stringify({
        memberId,
        permissions: ['organization:read', 'role:manage'],
      }),
    );

    const result = await redisPermissionCache.get({ organizationId, userId });

    expect(result).toEqual({
      memberId,
      permissions: ['organization:read', 'role:manage'],
    });
  });

  it('invalidates malformed cached values and treats them as cache misses', async () => {
    redisMock.get.mockResolvedValueOnce('not-json');

    const result = await redisPermissionCache.get({ organizationId, userId });

    expect(result).toBeNull();
    expect(redisMock.del).toHaveBeenCalledWith(permissionCacheKey({ organizationId, userId }));
  });

  it('invalidates unknown cached permissions and treats them as cache misses', async () => {
    redisMock.get.mockResolvedValueOnce(
      JSON.stringify({
        memberId,
        permissions: ['unknown:permission'],
      }),
    );

    const result = await redisPermissionCache.get({ organizationId, userId });

    expect(result).toBeNull();
    expect(redisMock.del).toHaveBeenCalledWith(permissionCacheKey({ organizationId, userId }));
  });

  it('sets permissions with ttl', async () => {
    await redisPermissionCache.set({
      organizationId,
      userId,
      value: {
        memberId,
        permissions: ['organization:read'],
      },
      ttlSeconds: 300,
    });

    expect(redisMock.set).toHaveBeenCalledWith(
      permissionCacheKey({ organizationId, userId }),
      JSON.stringify({
        memberId,
        permissions: ['organization:read'],
      }),
      'EX',
      300,
    );
  });
});
