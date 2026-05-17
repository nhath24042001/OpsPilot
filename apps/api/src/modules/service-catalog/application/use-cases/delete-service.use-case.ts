import type { ServiceRepository } from '../../domain/repositories/service.repository.js';

type Deps = {
  serviceRepository: ServiceRepository;
};

export const createDeleteServiceUseCase = (deps: Deps) => ({
  async execute(input: { organizationId: string; serviceId: string }) {
    await deps.serviceRepository.softDelete(input);
  },
});
