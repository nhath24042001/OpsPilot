import crypto from 'node:crypto';
import { signAccessToken, signRefreshToken } from '../../../../shared/auth/jwt.js';
import { hashOpaqueToken } from '../../../../shared/crypto/token.js';
import { env } from '../../../../shared/config/env.js';
import type { AuthUser } from '../../domain/entities/auth-user.entity.js';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.js';

export type TokenIssuerService = ReturnType<typeof createTokenIssuerService>;

const getRefreshTokenExpiresAt = () => {
  const date = new Date();
  date.setSeconds(date.getSeconds() + env.JWT_REFRESH_TTL_SECONDS);
  return date;
};

export const createTokenIssuerService = () => ({
  async issue(
    user: AuthUser,
    refreshTokenRepository: RefreshTokenRepository,
    familyId: string = crypto.randomUUID(),
  ) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ ...payload, jti: crypto.randomUUID() });

    const storedRefreshToken = await refreshTokenRepository.create({
      userId: user.id,
      tokenHash: hashOpaqueToken(refreshToken),
      familyId,
      expiresAt: getRefreshTokenExpiresAt(),
    });

    return {
      accessToken,
      refreshToken,
      storedRefreshTokenId: storedRefreshToken.id,
    };
  },
});
