import { prisma } from '../../../../shared/database/prisma.js';
import { domainError } from '../../../../shared/errors/app-error.js';
import { toPublicUser } from '../../domain/entities/auth-user.entity.js';
import { githubOAuthClient } from '../oauth-github.client.js';
import { googleOAuthClient } from '../oauth-google.client.js';
import { oauthStateService } from '../oauth-state.service.js';
import { tokenIssuerService } from '../services/token-issuer.service.js';

type OAuthProviderName = 'google' | 'github';

const oauthClients = {
  google: googleOAuthClient,
  github: githubOAuthClient,
} as const;

export const loginWithOAuthUseCase = {
  getAuthorizationUrl(provider: OAuthProviderName) {
    const client = oauthClients[provider];
    if (!client) {
      throw domainError('AUTH_OAUTH_PROVIDER_UNSUPPORTED');
    }

    const state = oauthStateService.create(provider);
    return client.getAuthorizationUrl(state);
  },

  async execute(input: { provider: OAuthProviderName; code: string; state: string }) {
    const client = oauthClients[input.provider];
    if (!client) {
      throw domainError('AUTH_OAUTH_PROVIDER_UNSUPPORTED');
    }

    oauthStateService.verify(input.state, input.provider);

    const profile = await client.exchangeCodeForProfile(input.code);

    const { user, tokens } = await prisma.$transaction(async (tx) => {
      const existingAccount = await tx.oAuthAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider: client.provider,
            providerAccountId: profile.providerAccountId,
          },
        },
        include: { user: true },
      });

      if (existingAccount?.user && !existingAccount.user.deletedAt) {
        const user = await tx.user.update({
          where: { id: existingAccount.user.id },
          data: {
            emailVerified: existingAccount.user.emailVerified || profile.emailVerified,
            name: existingAccount.user.name ?? profile.name,
            imageUrl: existingAccount.user.imageUrl ?? profile.imageUrl,
          },
        });

        await tx.oAuthAccount.update({
          where: { id: existingAccount.id },
          data: {
            accessToken: profile.accessToken,
            refreshToken: profile.refreshToken ?? existingAccount.refreshToken,
            expiresAt: profile.expiresAt,
            imageUrl: profile.imageUrl,
            deletedAt: null,
          },
        });

        const tokens = await tokenIssuerService.issue(user, tx);
        return { user, tokens };
      }

      const user = await tx.user.upsert({
        where: { email: profile.email },
        create: {
          email: profile.email,
          name: profile.name,
          imageUrl: profile.imageUrl,
          emailVerified: profile.emailVerified,
        },
        update: {
          emailVerified: profile.emailVerified || undefined,
          name: profile.name,
          imageUrl: profile.imageUrl,
        },
      });

      if (user.deletedAt) {
        throw domainError('AUTH_OAUTH_CALLBACK_FAILED');
      }

      await tx.oAuthAccount.upsert({
        where: {
          provider_providerAccountId: {
            provider: client.provider,
            providerAccountId: profile.providerAccountId,
          },
        },
        create: {
          userId: user.id,
          provider: client.provider,
          providerAccountId: profile.providerAccountId,
          imageUrl: profile.imageUrl,
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken,
          expiresAt: profile.expiresAt,
        },
        update: {
          userId: user.id,
          imageUrl: profile.imageUrl,
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken,
          expiresAt: profile.expiresAt,
          deletedAt: null,
        },
      });

      const tokens = await tokenIssuerService.issue(user, tx);
      return { user, tokens };
    });

    return {
      user: toPublicUser(user),
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  },
};

export type { OAuthProviderName };
