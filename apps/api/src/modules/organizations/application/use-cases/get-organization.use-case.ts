import { domainError } from '../../../../shared/errors/app-error.js';
import type { OrganizationRepository } from '../../domain/repositories/organization.repository.js';

type GetOrganizationInput = {
  userId: string;
  organizationId: string;
};

type GetOrganizationDeps = {
  organizationRepository: OrganizationRepository;
};

export const createGetOrganizationUseCase = (deps: GetOrganizationDeps) => ({
  async execute(input: GetOrganizationInput) {
    const organization = await deps.organizationRepository.findActiveForUser({
      userId: input.userId,
      organizationId: input.organizationId,
    });

    if (!organization) {
      throw domainError('ORGANIZATION_NOT_FOUND');
    }

    return { organization };
  },
});
