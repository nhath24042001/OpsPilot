import type { Permission } from './permission.vo.js';
import { PERMISSIONS } from './permission.vo.js';

export const SYSTEM_ROLE_NAMES = [
  'Owner',
  'Admin',
  'Incident Commander',
  'Engineer',
  'Viewer',
] as const;

export type SystemRoleName = (typeof SYSTEM_ROLE_NAMES)[number];

const SYSTEM_ROLE_NAME_SET = new Set<string>(SYSTEM_ROLE_NAMES);

export const isSystemRoleName = (value: string): value is SystemRoleName =>
  SYSTEM_ROLE_NAME_SET.has(value);

export const SYSTEM_ROLE_PERMISSIONS: Record<SystemRoleName, readonly Permission[]> = {
  Owner: PERMISSIONS,
  Admin: [
    'organization:read',
    'organization:update',
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
  ],
  'Incident Commander': [
    'organization:read',
    'member:read',
    'service:read',
    'incident:create',
    'incident:read',
    'incident:update',
    'incident:assign',
    'incident:resolve',
    'knowledge:read',
    'ai:ask',
    'ai:summarize',
    'audit:read',
  ],
  Engineer: [
    'organization:read',
    'member:read',
    'service:read',
    'incident:create',
    'incident:read',
    'incident:update',
    'knowledge:read',
    'ai:ask',
  ],
  Viewer: ['organization:read', 'member:read', 'service:read', 'incident:read', 'knowledge:read'],
};
