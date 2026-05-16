import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '../../src/modules/access-control/domain/value-objects/permission.vo.js';
import {
  SYSTEM_ROLE_NAMES,
  SYSTEM_ROLE_PERMISSIONS,
} from '../../src/modules/access-control/domain/value-objects/role.vo.js';

describe('system role permissions', () => {
  it('defines all default system roles', () => {
    expect(SYSTEM_ROLE_NAMES).toEqual([
      'Owner',
      'Admin',
      'Incident Commander',
      'Engineer',
      'Viewer',
    ]);
  });

  it('gives Owner every permission and keeps Viewer read-only', () => {
    expect(SYSTEM_ROLE_PERMISSIONS.Owner).toEqual(PERMISSIONS);
    expect(SYSTEM_ROLE_PERMISSIONS.Viewer).toEqual([
      'organization:read',
      'member:read',
      'service:read',
      'incident:read',
      'knowledge:read',
    ]);
  });

  it('does not reference unknown permissions in any role', () => {
    const permissionSet = new Set<string>(PERMISSIONS);

    for (const permissions of Object.values(SYSTEM_ROLE_PERMISSIONS)) {
      for (const permission of permissions) {
        expect(permissionSet.has(permission)).toBe(true);
      }
    }
  });
});
