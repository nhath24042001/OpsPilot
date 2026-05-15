import type { OrganizationEntity } from '../entities/organization.entity.js';

export interface OrganizationRepository {
  listActiveForUser(userId: string): Promise<OrganizationEntity[]>;
  findActiveForUser(input: {
    userId: string;
    organizationId: string;
  }): Promise<OrganizationEntity | null>;
}
