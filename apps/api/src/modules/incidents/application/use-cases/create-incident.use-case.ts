import { domainError } from '../../../../shared/errors/app-error.js';
import type { IncidentRepository } from '../../domain/repositories/incident.repository.js';
import { assertSev1HasOwner } from '../../domain/value-objects/incident-lifecycle.vo.js';

type Deps = {
  incidentRepository: IncidentRepository;
};

type Input = Parameters<IncidentRepository['create']>[0];

export const createCreateIncidentUseCase = (deps: Deps) => ({
  async execute(input: Input) {
    assertSev1HasOwner(input);

    if (input.serviceId) {
      const exists = await deps.incidentRepository.serviceExists({
        organizationId: input.organizationId,
        serviceId: input.serviceId,
      });
      if (!exists) {
        throw domainError('SERVICE_NOT_FOUND');
      }
    }

    for (const memberId of [input.commanderMemberId, input.assignedMemberId].filter(
      (value): value is string => typeof value === 'string',
    )) {
      const exists = await deps.incidentRepository.memberExists({
        organizationId: input.organizationId,
        memberId,
      });
      if (!exists) {
        throw domainError('ORGANIZATION_MEMBER_NOT_FOUND');
      }
    }

    const incident = await deps.incidentRepository.create(input);
    return { incident };
  },
});
