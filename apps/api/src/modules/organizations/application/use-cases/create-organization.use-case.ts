import crypto from 'node:crypto';
import type { OrganizationSetupRepository } from '../../domain/repositories/organization-setup.repository.js';

type CreateOrganizationInput = {
  userId: string;
  name: string;
};

type CreateOrganizationDeps = {
  organizationSetupRepository: OrganizationSetupRepository;
};

export const createCreateOrganizationUseCase = (deps: CreateOrganizationDeps) => ({
  async execute(input: CreateOrganizationInput) {
    const organizationId = crypto.randomUUID();

    const organization = await deps.organizationSetupRepository.setupOrganizationWithOwner({
      organizationId,
      userId: input.userId,
      organizationName: input.name,
    });

    return { organization };
  },
});
