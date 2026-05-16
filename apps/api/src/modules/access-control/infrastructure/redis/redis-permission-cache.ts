import { z } from 'zod';
import { redis } from '../../../../shared/redis/redis.js';
import type {
  CachedPermissions,
  PermissionCachePort,
} from '../../application/ports/permission-cache.port.js';
import { assertPermissions } from '../../domain/value-objects/permission.vo.js';

const cachedPermissionsSchema = z.object({
  memberId: z.string().uuid(),
  permissions: z.array(z.string()),
});

export const permissionCacheKey = (input: { organizationId: string; userId: string }) =>
  `org:${input.organizationId}:user:${input.userId}:permissions`;

const invalidate = async (input: { organizationId: string; userId: string }) => {
  await redis.del(permissionCacheKey(input));
};

export const redisPermissionCache: PermissionCachePort = {
  async get(input: { organizationId: string; userId: string }) {
    const raw = await redis.get(permissionCacheKey(input));
    if (!raw) {
      return null;
    }

    let decoded: unknown;
    try {
      decoded = JSON.parse(raw) as unknown;
    } catch {
      await invalidate(input);
      return null;
    }

    const parsed = cachedPermissionsSchema.safeParse(decoded);
    if (!parsed.success) {
      await invalidate(input);
      return null;
    }

    try {
      return {
        memberId: parsed.data.memberId,
        permissions: assertPermissions(parsed.data.permissions),
      };
    } catch {
      await invalidate(input);
      return null;
    }
  },

  async set(input: {
    organizationId: string;
    userId: string;
    value: CachedPermissions;
    ttlSeconds: number;
  }) {
    await redis.set(permissionCacheKey(input), JSON.stringify(input.value), 'EX', input.ttlSeconds);
  },

  async invalidate(input: { organizationId: string; userId: string }) {
    await invalidate(input);
  },
};
