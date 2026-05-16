import type { Permission } from '../../domain/value-objects/permission.vo.js';

export type CachedPermissions = {
  memberId: string;
  permissions: Permission[];
};

export interface PermissionCachePort {
  get(input: { organizationId: string; userId: string }): Promise<CachedPermissions | null>;
  set(input: {
    organizationId: string;
    userId: string;
    value: CachedPermissions;
    ttlSeconds: number;
  }): Promise<void>;
  invalidate(input: { organizationId: string; userId: string }): Promise<void>;
}
