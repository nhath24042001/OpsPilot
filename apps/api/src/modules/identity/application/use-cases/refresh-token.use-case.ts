import { domainError } from '../../../../shared/errors/app-error.js';
import { toPublicUser } from '../../domain/entities/auth-user.entity.js';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import { hashOpaqueToken } from '../../../../shared/crypto/token.js';
import { verifyRefreshToken } from '../../../../shared/auth/jwt.js';
import type { TokenIssuerService } from '../services/token-issuer.service.js';

type RefreshTokenInput = {
  refreshToken: string;
};

type RefreshTokenDeps = {
  refreshTokenRepository: RefreshTokenRepository;
  userRepository: UserRepository;
  tokenIssuer: TokenIssuerService;
};

export const createRefreshTokenUseCase = (deps: RefreshTokenDeps) => ({
  async execute(input: RefreshTokenInput) {
    let payload: { sub: string; email: string };
    try {
      payload = verifyRefreshToken(input.refreshToken);
    } catch {
      throw domainError('AUTH_INVALID_REFRESH_TOKEN');
    }

    const tokenHash = hashOpaqueToken(input.refreshToken);
    const stored = await deps.refreshTokenRepository.findByHash(tokenHash);

    if (
      !stored ||
      stored.expiresAt < new Date() ||
      stored.userId !== payload.sub ||
      stored.user.deletedAt
    ) {
      throw domainError('AUTH_INVALID_REFRESH_TOKEN');
    }

    if (stored.revokedAt) {
      await deps.refreshTokenRepository.revokeFamily(stored.familyId);
      throw domainError('AUTH_REFRESH_TOKEN_REUSE_DETECTED');
    }

    const tokens = await deps.tokenIssuer.issue(
      stored.user,
      deps.refreshTokenRepository,
      stored.familyId,
    );

    await deps.refreshTokenRepository.revoke(stored.id, tokens.storedRefreshTokenId);

    return {
      user: toPublicUser(stored.user),
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  },
});
