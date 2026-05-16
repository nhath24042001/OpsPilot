export const OAUTH_PROVIDERS = ['google', 'github'] as const;
export type OAuthProviderName = (typeof OAUTH_PROVIDERS)[number];
