import { domainError } from '../../../../shared/errors/app-error.js';
import { toPublicUser } from '../../domain/entities/auth-user.entity.js';
import type { OAuthProviderName } from '../../domain/value-objects/oauth-provider.vo.js';
import type { OAuthProviderClient } from '../ports/oauth-provider.port.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import type { OAuthAccountRepository } from '../../domain/repositories/oauth-account.repository.js';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.js';
import type { TokenIssuerService } from '../services/token-issuer.service.js';
import { oauthStateService } from '../oauth-state.service.js';

type LoginWithOAuthInput = {
  provider: OAuthProviderName;
  code: string;
  state: string;
};

type LoginWithOAuthDeps = {
  userRepository: UserRepository;
  oauthAccountRepository: OAuthAccountRepository;
  refreshTokenRepository: RefreshTokenRepository;
  tokenIssuer: TokenIssuerService;
  oauthClients: Record<OAuthProviderName, OAuthProviderClient>;
};

export const createLoginWithOAuthUseCase = (deps: LoginWithOAuthDeps) => ({
  getAuthorizationUrl(provider: OAuthProviderName) {
    const client = deps.oauthClients[provider];
    if (!client) {
      throw domainError('AUTH_OAUTH_PROVIDER_UNSUPPORTED');
    }

    const state = oauthStateService.create(provider);
    return client.getAuthorizationUrl(state);
  },

  async execute(input: LoginWithOAuthInput) {
    const client = deps.oauthClients[input.provider];
    if (!client) {
      throw domainError('AUTH_OAUTH_PROVIDER_UNSUPPORTED');
    }

    oauthStateService.verify(input.state, input.provider);

    const profile = await client.exchangeCodeForProfile(input.code);

    const existingAccount = await deps.oauthAccountRepository.findByProvider(
      input.provider,
      profile.providerAccountId,
    );

    let user;

    if (existingAccount?.user && !existingAccount.user.deletedAt) {
      user = await deps.userRepository.upsertFromOAuth({
        email: existingAccount.user.email,
        name: existingAccount.user.name ?? profile.name,
        imageUrl: existingAccount.user.imageUrl ?? profile.imageUrl,
        emailVerified: existingAccount.user.emailVerified || profile.emailVerified,
      });

      await deps.oauthAccountRepository.upsert({
        userId: user.id,
        provider: input.provider,
        providerAccountId: profile.providerAccountId,
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken ?? existingAccount.refreshToken,
        expiresAt: profile.expiresAt,
        imageUrl: profile.imageUrl,
      });
    } else {
      user = await deps.userRepository.upsertFromOAuth({
        email: profile.email,
        name: profile.name,
        imageUrl: profile.imageUrl,
        emailVerified: profile.emailVerified,
      });

      if (user.deletedAt) {
        throw domainError('AUTH_OAUTH_CALLBACK_FAILED');
      }

      await deps.oauthAccountRepository.upsert({
        userId: user.id,
        provider: input.provider,
        providerAccountId: profile.providerAccountId,
        imageUrl: profile.imageUrl,
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
        expiresAt: profile.expiresAt,
      });
    }

    const tokens = await deps.tokenIssuer.issue(user, deps.refreshTokenRepository);

    return {
      user: toPublicUser(user),
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  },
});
