import { prisma } from '../../../../shared/database/prisma.js';
import type { OAuthProviderName } from '../../domain/value-objects/oauth-provider.vo.js';
import type { OAuthProvider } from '@prisma/client';
import type {
  OAuthAccountRepository,
  OAuthAccountWithUser,
  UpsertOAuthAccountInput,
} from '../../domain/repositories/oauth-account.repository.js';

export const prismaOAuthAccountRepository: OAuthAccountRepository = {
  async findByProvider(provider: OAuthProviderName, providerAccountId: string) {
    const account = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: provider.toUpperCase() as OAuthProvider,
          providerAccountId,
        },
      },
      include: { user: true },
    });

    if (!account) {
      return null;
    }

    const result: OAuthAccountWithUser = {
      id: account.id,
      userId: account.userId,
      provider: account.provider.toLowerCase() as OAuthProviderName,
      providerAccountId: account.providerAccountId,
      imageUrl: account.imageUrl,
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      expiresAt: account.expiresAt,
      deletedAt: account.deletedAt,
      user: {
        id: account.user.id,
        email: account.user.email,
        name: account.user.name,
        imageUrl: account.user.imageUrl,
        emailVerified: account.user.emailVerified,
        deletedAt: account.user.deletedAt,
      },
    };

    return result;
  },

  async upsert(input: UpsertOAuthAccountInput) {
    await prisma.oAuthAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: input.provider.toUpperCase() as OAuthProvider,
          providerAccountId: input.providerAccountId,
        },
      },
      create: {
        userId: input.userId,
        provider: input.provider.toUpperCase() as OAuthProvider,
        providerAccountId: input.providerAccountId,
        imageUrl: input.imageUrl,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        expiresAt: input.expiresAt,
      },
      update: {
        userId: input.userId,
        imageUrl: input.imageUrl,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        expiresAt: input.expiresAt,
        deletedAt: null,
      },
    });
  },
};
