import type { ServiceStatus } from '@prisma/client';

export type ServiceEntity = {
  id: string;
  organizationId: string;
  ownerMemberId: string | null;
  name: string;
  description: string | null;
  status: ServiceStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};
