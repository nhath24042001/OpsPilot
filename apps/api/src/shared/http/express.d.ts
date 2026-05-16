import type { Permission } from '../../modules/access-control/domain/value-objects/permission.vo.js';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
      };
      orgContext?: {
        organizationId: string;
        memberId: string;
        permissions: Permission[];
      };
    }
  }
}

export {};
