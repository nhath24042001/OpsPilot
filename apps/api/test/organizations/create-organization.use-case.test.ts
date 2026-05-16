import { describe, expect, it, vi } from 'vitest';
import { createCreateOrganizationUseCase } from '../../src/modules/organizations/application/use-cases/create-organization.use-case.js';
import type { OrganizationSetupRepository } from '../../src/modules/organizations/domain/repositories/organization-setup.repository.js';
import type { OrganizationEntity } from '../../src/modules/organizations/domain/entities/organization.entity.js';

describe('createOrganizationUseCase', () => {
  const setupOrganizationWithOwner = vi.fn<OrganizationSetupRepository['setupOrganizationWithOwner']>();

  const mockSetupRepo = {
    setupOrganizationWithOwner,
  } as unknown as OrganizationSetupRepository;

  const useCase = createCreateOrganizationUseCase({
    organizationSetupRepository: mockSetupRepo,
  });

  it('generates ID and calls setup repository', async () => {
    const mockOrg: OrganizationEntity = {
      id: 'org-1',
      name: 'Test Org',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    setupOrganizationWithOwner.mockResolvedValueOnce(mockOrg);

    const result = await useCase.execute({
      userId: 'user-1',
      name: 'Test Org',
    });

    expect(setupOrganizationWithOwner).toHaveBeenCalledTimes(1);
    const input = setupOrganizationWithOwner.mock.calls[0]?.[0];
    expect(input).toBeDefined();
    if (!input) {
      throw new Error('Expected setupOrganizationWithOwner to be called');
    }
    expect(typeof input.organizationId).toBe('string');
    expect(input.userId).toBe('user-1');
    expect(input.organizationName).toBe('Test Org');

    expect(result.organization).toEqual(mockOrg);
  });
});
