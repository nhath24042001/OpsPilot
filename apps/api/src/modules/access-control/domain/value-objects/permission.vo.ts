export const PERMISSIONS = [
  'organization:read',
  'organization:update',
  'organization:delete',
  'member:read',
  'member:invite',
  'member:remove',
  'role:manage',
  'service:create',
  'service:read',
  'service:update',
  'service:delete',
  'incident:create',
  'incident:read',
  'incident:update',
  'incident:assign',
  'incident:resolve',
  'knowledge:create',
  'knowledge:read',
  'knowledge:index',
  'knowledge:delete',
  'ai:ask',
  'ai:summarize',
  'audit:read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_SET = new Set<string>(PERMISSIONS);

export const isPermission = (value: string): value is Permission => PERMISSION_SET.has(value);

export const assertPermissions = (permissions: readonly string[]): Permission[] => {
  const invalid = permissions.filter((permission) => !isPermission(permission));
  if (invalid.length > 0) {
    throw new Error(`Unknown permissions: ${invalid.join(', ')}`);
  }

  return [...new Set(permissions)] as Permission[];
};
