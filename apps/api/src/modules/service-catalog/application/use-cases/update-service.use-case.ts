import { domainError } from '../../../../shared/errors/app-error.js';
import type { ServiceRepository } from '../../domain/repositories/service.repository.js';

type Deps = {
  serviceRepository: ServiceRepository;
};

type Input = {
  organizationId: string;
  serviceId: string;
  ownerMemberId?: string | null;
  name?: string;
  description?: string | null;
};

export const createUpdateServiceUseCase = (deps: Deps) => ({
  async execute(input: Input) {
    if (input.ownerMemberId) {
      const ownerExists = await deps.serviceRepository.memberExists({
        organizationId: input.organizationId,
        memberId: input.ownerMemberId,
      });
      if (!ownerExists) {
        throw domainError('ORGANIZATION_MEMBER_NOT_FOUND');
      }
    }

    const service = await deps.serviceRepository.update(input);
    return { service };
  },
});
