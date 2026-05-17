import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCreateServiceUseCase } from '../../src/modules/service-catalog/application/use-cases/create-service.use-case.js';
import { createListServicesUseCase } from '../../src/modules/service-catalog/application/use-cases/list-services.use-case.js';
import type { ServiceRepository } from '../../src/modules/service-catalog/domain/repositories/service.repository.js';

describe('service catalog use cases', () => {
  const create = vi.fn<ServiceRepository['create']>();
  const list = vi.fn<ServiceRepository['list']>();
  const memberExists = vi.fn<ServiceRepository['memberExists']>();

  const serviceRepository = {
    create,
    list,
    memberExists,
  } as unknown as ServiceRepository;

  const organizationId = '11111111-1111-1111-1111-111111111111';
  const ownerMemberId = '22222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a service with an explicit active service owner', async () => {
    memberExists.mockResolvedValueOnce(true);
    create.mockResolvedValueOnce({
      id: '33333333-3333-3333-3333-333333333333',
      organizationId,
      ownerMemberId,
      name: 'payment-service',
      description: 'Payment processing',
      status: 'ACTIVE',
      createdAt: new Date('2026-05-17T00:00:00.000Z'),
      updatedAt: new Date('2026-05-17T00:00:00.000Z'),
      deletedAt: null,
    });

    const useCase = createCreateServiceUseCase({ serviceRepository });
    const result = await useCase.execute({
      organizationId,
      ownerMemberId,
      name: 'payment-service',
      description: 'Payment processing',
    });

    expect(memberExists).toHaveBeenCalledWith({ organizationId, memberId: ownerMemberId });
    expect(create).toHaveBeenCalledWith({
      organizationId,
      ownerMemberId,
      name: 'payment-service',
      description: 'Payment processing',
    });
    expect(result.service.ownerMemberId).toBe(ownerMemberId);
  });

  it('rejects service owner outside the organization', async () => {
    memberExists.mockResolvedValueOnce(false);
    const useCase = createCreateServiceUseCase({ serviceRepository });

    await expect(
      useCase.execute({
        organizationId,
        ownerMemberId,
        name: 'payment-service',
      }),
    ).rejects.toHaveProperty('code', 'ORGANIZATION_MEMBER_NOT_FOUND');

    expect(create).not.toHaveBeenCalled();
  });

  it('delegates cursor pagination arguments to repository', async () => {
    list.mockResolvedValueOnce({
      items: [],
      pageInfo: { limit: 10, nextCursor: null },
    });

    const useCase = createListServicesUseCase({ serviceRepository });
    await useCase.execute(organizationId, { limit: 10, cursor: 'abc' });

    expect(list).toHaveBeenCalledWith(organizationId, { limit: 10, cursor: 'abc' });
  });
});
