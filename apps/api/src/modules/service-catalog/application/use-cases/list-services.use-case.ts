import type { CursorPageInput } from '../../../../shared/pagination/cursor-pagination.js';
import type { ServiceRepository } from '../../domain/repositories/service.repository.js';

type Deps = {
  serviceRepository: ServiceRepository;
};

export const createListServicesUseCase = (deps: Deps) => ({
  async execute(organizationId: string, page: CursorPageInput) {
    return deps.serviceRepository.list(organizationId, page);
  },
});
