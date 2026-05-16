import { env } from '../../../../shared/config/env.js';
import { domainError } from '../../../../shared/errors/app-error.js';
import type { OAuthProviderClient, OAuthProviderProfile } from '../../application/ports/oauth-provider.port.js';

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  id_token?: string;
  error?: string;
};

type GoogleUserInfoResponse = {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
};

const googleAuthorizeUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
const googleTokenUrl = 'https://oauth2.googleapis.com/token';
const googleUserInfoUrl = 'https://openidconnect.googleapis.com/v1/userinfo';

export const googleOAuthClient: OAuthProviderClient = {
  providerName: 'google',

  getAuthorizationUrl(state: string) {
    if (!env.OAUTH_GOOGLE_CLIENT_ID || !env.OAUTH_GOOGLE_CALLBACK_URL) {
      throw domainError('AUTH_OAUTH_PROVIDER_NOT_CONFIGURED');
    }

    const url = new URL(googleAuthorizeUrl);
    url.searchParams.set('client_id', env.OAUTH_GOOGLE_CLIENT_ID);
    url.searchParams.set('redirect_uri', env.OAUTH_GOOGLE_CALLBACK_URL);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    url.searchParams.set('state', state);

    return url.toString();
  },

  async exchangeCodeForProfile(code: string): Promise<OAuthProviderProfile> {
    if (
      !env.OAUTH_GOOGLE_CLIENT_ID ||
      !env.OAUTH_GOOGLE_CLIENT_SECRET ||
      !env.OAUTH_GOOGLE_CALLBACK_URL
    ) {
      throw domainError('AUTH_OAUTH_PROVIDER_NOT_CONFIGURED');
    }

    const tokenResponse = await fetch(googleTokenUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: env.OAUTH_GOOGLE_CLIENT_ID,
        client_secret: env.OAUTH_GOOGLE_CLIENT_SECRET,
        redirect_uri: env.OAUTH_GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw domainError('AUTH_OAUTH_CALLBACK_FAILED');
    }

    const tokens = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokens.access_token || tokens.error) {
      throw domainError('AUTH_OAUTH_CALLBACK_FAILED');
    }

    const userResponse = await fetch(googleUserInfoUrl, {
      headers: {
        authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw domainError('AUTH_OAUTH_CALLBACK_FAILED');
    }

    const user = (await userResponse.json()) as GoogleUserInfoResponse;

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    return {
      providerAccountId: user.sub,
      email: user.email.toLowerCase(),
      emailVerified: user.email_verified,
      name: user.name,
      imageUrl: user.picture ?? null,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt,
    };
  },
};
