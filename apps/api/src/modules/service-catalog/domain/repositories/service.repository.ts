import type { CursorPage, CursorPageInput } from '../../../../shared/pagination/cursor-pagination.js';
import type { ServiceEntity } from '../entities/service.entity.js';

export type CreateServiceInput = {
  organizationId: string;
  ownerMemberId?: string | null;
  name: string;
  description?: string | null;
};

export type UpdateServiceInput = {
  organizationId: string;
  serviceId: string;
  ownerMemberId?: string | null;
  name?: string;
  description?: string | null;
};

export interface ServiceRepository {
  create(input: CreateServiceInput): Promise<ServiceEntity>;
  list(organizationId: string, page: CursorPageInput): Promise<CursorPage<ServiceEntity>>;
  findActive(input: { organizationId: string; serviceId: string }): Promise<ServiceEntity | null>;
  update(input: UpdateServiceInput): Promise<ServiceEntity>;
  softDelete(input: { organizationId: string; serviceId: string }): Promise<void>;
  memberExists(input: { organizationId: string; memberId: string }): Promise<boolean>;
}
