import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createGetCurrentUserUseCase } from '../../src/modules/identity/application/use-cases/get-current-user.use-case.js';
import type { AuthUser } from '../../src/modules/identity/domain/entities/auth-user.entity.js';
import type { UserRepository } from '../../src/modules/identity/domain/repositories/user.repository.js';

describe('getCurrentUserUseCase', () => {
  const findActiveById = vi.fn<UserRepository['findActiveById']>();

  const mockUserRepo = {
    findActiveById,
  } as unknown as UserRepository;

  const useCase = createGetCurrentUserUseCase({
    userRepository: mockUserRepo,
  });

  const user: AuthUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test',
    imageUrl: null,
    passwordHash: 'hashed',
    emailVerified: true,
    createdAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the public user for an active user id', async () => {
    findActiveById.mockResolvedValueOnce(user);

    const result = await useCase.execute('user-1');

    expect(findActiveById).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test',
      imageUrl: null,
      emailVerified: true,
      createdAt: user.createdAt,
    });
  });

  it('throws unauthorized when no active user exists', async () => {
    findActiveById.mockResolvedValueOnce(null);

    await expect(useCase.execute('missing-user')).rejects.toHaveProperty('code', 'AUTH_UNAUTHORIZED');
  });
});
