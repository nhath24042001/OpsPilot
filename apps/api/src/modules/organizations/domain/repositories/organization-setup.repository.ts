import type { OrganizationEntity } from '../entities/organization.entity.js';

export type SetupOrganizationInput = {
  organizationId: string;
  userId: string;
  organizationName: string;
};

export interface OrganizationSetupRepository {
  setupOrganizationWithOwner(input: SetupOrganizationInput): Promise<OrganizationEntity>;
}
