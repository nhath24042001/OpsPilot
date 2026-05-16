import { describe, expect, it, vi } from 'vitest';
import { createCreateOrganizationUseCase } from '../../src/modules/organizations/application/use-cases/create-organization.use-case.js';
import type { OrganizationSetupRepository } from '../../src/modules/organizations/domain/repositories/organization-setup.repository.js';
import crypto from 'node:crypto';

describe('createOrganizationUseCase', () => {
  const mockSetupRepo = {
    setupOrganizationWithOwner: vi.fn(),
  } as unknown as OrganizationSetupRepository;

  const useCase = createCreateOrganizationUseCase({
    organizationSetupRepository: mockSetupRepo,
  });

  it('generates ID and calls setup repository', async () => {
    const mockOrg = {
      id: 'org-1',
      name: 'Test Org',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(mockSetupRepo.setupOrganizationWithOwner).mockResolvedValueOnce(mockOrg as any);

    const result = await useCase.execute({
      userId: 'user-1',
      name: 'Test Org',
    });

    expect(mockSetupRepo.setupOrganizationWithOwner).toHaveBeenCalledWith({
      organizationId: expect.any(String),
      userId: 'user-1',
      organizationName: 'Test Org',
    });

    expect(result.organization).toEqual(mockOrg);
  });
});
