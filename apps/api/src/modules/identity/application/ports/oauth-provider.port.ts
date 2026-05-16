import type { OAuthProviderName } from '../../domain/value-objects/oauth-provider.vo.js';

export type OAuthProviderProfile = {
  providerAccountId: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  imageUrl: string | null;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
};

export interface OAuthProviderClient {
  readonly providerName: OAuthProviderName;
  getAuthorizationUrl(state: string): string;
  exchangeCodeForProfile(code: string): Promise<OAuthProviderProfile>;
}
