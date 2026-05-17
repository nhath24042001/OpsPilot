import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAcknowledgeIncidentUseCase } from '../../src/modules/incidents/application/use-cases/acknowledge-incident.use-case.js';
import { createAssignIncidentUseCase } from '../../src/modules/incidents/application/use-cases/assign-incident.use-case.js';
import { createCreateIncidentUseCase } from '../../src/modules/incidents/application/use-cases/create-incident.use-case.js';
import { createResolveIncidentUseCase } from '../../src/modules/incidents/application/use-cases/resolve-incident.use-case.js';
import type { IncidentEntity } from '../../src/modules/incidents/domain/entities/incident.entity.js';
import type { IncidentRepository } from '../../src/modules/incidents/domain/repositories/incident.repository.js';

describe('incident use cases', () => {
  const create = vi.fn<IncidentRepository['create']>();
  const findActive = vi.fn<IncidentRepository['findActive']>();
  const acknowledge = vi.fn<IncidentRepository['acknowledge']>();
  const assign = vi.fn<IncidentRepository['assign']>();
  const resolve = vi.fn<IncidentRepository['resolve']>();
  const memberExists = vi.fn<IncidentRepository['memberExists']>();
  const serviceExists = vi.fn<IncidentRepository['serviceExists']>();

  const incidentRepository = {
    create,
    findActive,
    acknowledge,
    assign,
    resolve,
    memberExists,
    serviceExists,
  } as unknown as IncidentRepository;

  const organizationId = '11111111-1111-1111-1111-111111111111';
  const incidentId = '22222222-2222-2222-2222-222222222222';
  const memberId = '33333333-3333-3333-3333-333333333333';
  const serviceId = '44444444-4444-4444-4444-444444444444';

  const incident = (overrides: Partial<IncidentEntity> = {}): IncidentEntity => ({
    id: incidentId,
    organizationId,
    serviceId,
    commanderMemberId: null,
    assignedMemberId: memberId,
    title: 'Checkout is failing',
    description: null,
    severity: 'SEV2',
    status: 'OPEN',
    rootCause: null,
    resolution: null,
    acknowledgedAt: null,
    resolvedAt: null,
    canceledAt: null,
    createdAt: new Date('2026-05-17T00:00:00.000Z'),
    updatedAt: new Date('2026-05-17T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an incident with explicit service and assignee business roles', async () => {
    serviceExists.mockResolvedValueOnce(true);
    memberExists.mockResolvedValueOnce(true);
    create.mockResolvedValueOnce(incident());

    const useCase = createCreateIncidentUseCase({ incidentRepository });
    const result = await useCase.execute({
      organizationId,
      serviceId,
      assignedMemberId: memberId,
      title: 'Checkout is failing',
      severity: 'SEV2',
    });

    expect(serviceExists).toHaveBeenCalledWith({ organizationId, serviceId });
    expect(memberExists).toHaveBeenCalledWith({ organizationId, memberId });
    expect(result.incident.assignedMemberId).toBe(memberId);
  });

  it('requires SEV1 incidents to have an assignee or incident commander', async () => {
    const useCase = createCreateIncidentUseCase({ incidentRepository });

    await expect(
      useCase.execute({
        organizationId,
        title: 'Region outage',
        severity: 'SEV1',
      }),
    ).rejects.toHaveProperty('code', 'VALIDATION_FAILED');

    expect(create).not.toHaveBeenCalled();
  });

  it('acknowledges an open incident', async () => {
    findActive.mockResolvedValueOnce(incident());
    acknowledge.mockResolvedValueOnce(incident({ status: 'ACKNOWLEDGED' }));

    const useCase = createAcknowledgeIncidentUseCase({ incidentRepository });
    const result = await useCase.execute({ organizationId, incidentId });

    expect(acknowledge).toHaveBeenCalledWith({ organizationId, incidentId });
    expect(result.incident.status).toBe('ACKNOWLEDGED');
  });

  it('rejects acknowledging a resolved incident', async () => {
    findActive.mockResolvedValueOnce(incident({ status: 'RESOLVED' }));
    const useCase = createAcknowledgeIncidentUseCase({ incidentRepository });

    await expect(useCase.execute({ organizationId, incidentId })).rejects.toHaveProperty(
      'code',
      'INCIDENT_INVALID_TRANSITION',
    );

    expect(acknowledge).not.toHaveBeenCalled();
  });

  it('rejects assigning a resolved incident', async () => {
    findActive.mockResolvedValueOnce(incident({ status: 'RESOLVED' }));
    const useCase = createAssignIncidentUseCase({ incidentRepository });

    await expect(
      useCase.execute({ organizationId, incidentId, assignedMemberId: memberId }),
    ).rejects.toHaveProperty('code', 'INCIDENT_INVALID_TRANSITION');

    expect(assign).not.toHaveBeenCalled();
  });

  it('resolves acknowledged incident only with root cause and resolution', async () => {
    findActive.mockResolvedValueOnce(incident({ status: 'ACKNOWLEDGED' }));
    resolve.mockResolvedValueOnce(
      incident({
        status: 'RESOLVED',
        rootCause: 'Queue saturation',
        resolution: 'Scaled workers',
      }),
    );

    const useCase = createResolveIncidentUseCase({ incidentRepository });
    const result = await useCase.execute({
      organizationId,
      incidentId,
      rootCause: 'Queue saturation',
      resolution: 'Scaled workers',
    });

    expect(resolve).toHaveBeenCalledWith({
      organizationId,
      incidentId,
      rootCause: 'Queue saturation',
      resolution: 'Scaled workers',
    });
    expect(result.incident.status).toBe('RESOLVED');
  });
});
