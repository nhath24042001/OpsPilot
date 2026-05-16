import type { OAuthProviderName } from '../value-objects/oauth-provider.vo.js';

export type OAuthAccountWithUser = {
  id: string;
  userId: string;
  provider: OAuthProviderName;
  providerAccountId: string;
  imageUrl: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
  deletedAt: Date | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    imageUrl: string | null;
    emailVerified: boolean;
    deletedAt: Date | null;
  };
};

export type UpsertOAuthAccountInput = {
  userId: string;
  provider: OAuthProviderName;
  providerAccountId: string;
  imageUrl: string | null;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
};

export interface OAuthAccountRepository {
  findByProvider(
    provider: OAuthProviderName,
    providerAccountId: string,
  ): Promise<OAuthAccountWithUser | null>;
  upsert(input: UpsertOAuthAccountInput): Promise<void>;
}
