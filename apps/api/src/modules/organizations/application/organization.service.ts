import type { createCreateOrganizationUseCase } from './use-cases/create-organization.use-case.js';
import type { createListOrganizationsUseCase } from './use-cases/list-organizations.use-case.js';
import type { createGetOrganizationUseCase } from './use-cases/get-organization.use-case.js';

export type OrganizationUseCases = {
  createOrganization: ReturnType<typeof createCreateOrganizationUseCase>;
  listOrganizations: ReturnType<typeof createListOrganizationsUseCase>;
  getOrganization: ReturnType<typeof createGetOrganizationUseCase>;
};

export const createOrganizationService = (useCases: OrganizationUseCases) => ({
  create: useCases.createOrganization.execute,
  list: useCases.listOrganizations.execute,
  get: useCases.getOrganization.execute,
});
