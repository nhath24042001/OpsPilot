import { unauthorized } from '../../../../shared/errors/app-error.js';
import { toPublicUser } from '../../domain/entities/auth-user.entity.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';

type GetCurrentUserDeps = {
  userRepository: UserRepository;
};

export const createGetCurrentUserUseCase = (deps: GetCurrentUserDeps) => ({
  async execute(userId: string) {
    const user = await deps.userRepository.findActiveById(userId);
    if (!user) {
      throw unauthorized();
    }
    return toPublicUser(user);
  },
});
