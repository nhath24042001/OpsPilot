import type { OrganizationRepository } from '../../domain/repositories/organization.repository.js';

type ListOrganizationsDeps = {
  organizationRepository: OrganizationRepository;
};

export const createListOrganizationsUseCase = (deps: ListOrganizationsDeps) => ({
  async execute(userId: string) {
    const organizations = await deps.organizationRepository.listActiveForUser(userId);
    return { organizations };
  },
});
