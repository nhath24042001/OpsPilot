import { domainError } from '../../../../shared/errors/app-error.js';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.js';
import { hashOpaqueToken } from '../../../../shared/crypto/token.js';

type LogoutInput = {
  refreshToken: string;
};

type LogoutDeps = {
  refreshTokenRepository: RefreshTokenRepository;
};

export const createLogoutUseCase = (deps: LogoutDeps) => ({
  async execute(input: LogoutInput) {
    if (!input.refreshToken) {
      throw domainError('AUTH_REFRESH_TOKEN_REQUIRED');
    }

    const tokenHash = hashOpaqueToken(input.refreshToken);
    const stored = await deps.refreshTokenRepository.findByHash(tokenHash);

    if (!stored || stored.revokedAt) {
      return;
    }

    await deps.refreshTokenRepository.revoke(stored.id, stored.id);
  },
});
