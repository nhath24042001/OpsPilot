import type { OrganizationEntity } from '../entities/organization.entity.js';

export type CreateOrganizationInput = {
  name: string;
};

export interface OrganizationRepository {
  create(input: CreateOrganizationInput): Promise<OrganizationEntity>;
  listActiveForUser(userId: string): Promise<OrganizationEntity[]>;
  findActiveForUser(input: {
    userId: string;
    organizationId: string;
  }): Promise<OrganizationEntity | null>;
}

