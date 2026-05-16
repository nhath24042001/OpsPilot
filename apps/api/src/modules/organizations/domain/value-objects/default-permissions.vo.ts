export const DEFAULT_PERMISSIONS = [
  'organization:read',
  'organization:update',
  'organization:delete',
  'member:read',
  'member:invite',
  'member:remove',
] as const;

export type Permission = (typeof DEFAULT_PERMISSIONS)[number];
