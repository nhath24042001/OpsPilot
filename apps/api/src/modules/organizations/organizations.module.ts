import { createCreateOrganizationUseCase } from './application/use-cases/create-organization.use-case.js';
import { createGetOrganizationUseCase } from './application/use-cases/get-organization.use-case.js';
import { createListOrganizationsUseCase } from './application/use-cases/list-organizations.use-case.js';
import { createOrganizationService } from './application/organization.service.js';
import { prismaOrganizationRepository } from './infrastructure/prisma/prisma-organization.repository.js';
import { prismaOrganizationSetupRepository } from './infrastructure/prisma/prisma-organization-setup.repository.js';

export const createOrganizationsModule = () => {
  const organizationRepository = prismaOrganizationRepository;
  const organizationSetupRepository = prismaOrganizationSetupRepository;

  const useCases = {
    createOrganization: createCreateOrganizationUseCase({ organizationSetupRepository }),
    listOrganizations: createListOrganizationsUseCase({ organizationRepository }),
    getOrganization: createGetOrganizationUseCase({ organizationRepository }),
  };

  const organizationService = createOrganizationService(useCases);

  return {
    organizationService,
  };
};

export const organizationsModule = createOrganizationsModule();
