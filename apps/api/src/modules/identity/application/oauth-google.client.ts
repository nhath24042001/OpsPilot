import { env } from '../../../shared/config/env.js';
import { domainError } from '../../../shared/errors/app-error.js';

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  id_token?: string;
};

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

const googleAuthorizeUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
const googleTokenUrl = 'https://oauth2.googleapis.com/token';
const googleUserInfoUrl = 'https://openidconnect.googleapis.com/v1/userinfo';

export const googleOAuthClient = {
  provider: 'GOOGLE' as const,

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

  async exchangeCodeForProfile(code: string) {
    if (
      !env.OAUTH_GOOGLE_CLIENT_ID ||
      !env.OAUTH_GOOGLE_CLIENT_SECRET ||
      !env.OAUTH_GOOGLE_CALLBACK_URL
    ) {
      throw domainError('AUTH_OAUTH_PROVIDER_NOT_CONFIGURED');
    }

    const tokenResponse = await fetch(googleTokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
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

    const profileResponse = await fetch(googleUserInfoUrl, {
      headers: {
        authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      throw domainError('AUTH_OAUTH_CALLBACK_FAILED');
    }

    const profile = (await profileResponse.json()) as GoogleUserInfo;

    return {
      providerAccountId: profile.sub,
      email: profile.email.toLowerCase(),
      emailVerified: Boolean(profile.email_verified),
      name: profile.name,
      imageUrl: profile.picture,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
    };
  },
};
