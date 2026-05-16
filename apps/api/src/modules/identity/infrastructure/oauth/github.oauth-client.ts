import { env } from '../../../../shared/config/env.js';
import { domainError } from '../../../../shared/errors/app-error.js';
import type { OAuthProviderClient, OAuthProviderProfile } from '../../application/ports/oauth-provider.port.js';

type GitHubTokenResponse = {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
};

type GitHubUser = {
  id: number;
  login: string;
  name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
};

type GitHubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
};

const githubAuthorizeUrl = 'https://github.com/login/oauth/authorize';
const githubTokenUrl = 'https://github.com/login/oauth/access_token';
const githubUserUrl = 'https://api.github.com/user';
const githubEmailsUrl = 'https://api.github.com/user/emails';

const githubHeaders = {
  accept: 'application/vnd.github+json',
  'user-agent': 'OpsPilot',
  'x-github-api-version': '2022-11-28',
};

export const githubOAuthClient: OAuthProviderClient = {
  providerName: 'github',

  getAuthorizationUrl(state: string) {
    if (!env.OAUTH_GITHUB_CLIENT_ID || !env.OAUTH_GITHUB_CALLBACK_URL) {
      throw domainError('AUTH_OAUTH_PROVIDER_NOT_CONFIGURED');
    }

    const url = new URL(githubAuthorizeUrl);
    url.searchParams.set('client_id', env.OAUTH_GITHUB_CLIENT_ID);
    url.searchParams.set('redirect_uri', env.OAUTH_GITHUB_CALLBACK_URL);
    url.searchParams.set('scope', 'read:user user:email');
    url.searchParams.set('state', state);

    return url.toString();
  },

  async exchangeCodeForProfile(code: string): Promise<OAuthProviderProfile> {
    if (
      !env.OAUTH_GITHUB_CLIENT_ID ||
      !env.OAUTH_GITHUB_CLIENT_SECRET ||
      !env.OAUTH_GITHUB_CALLBACK_URL
    ) {
      throw domainError('AUTH_OAUTH_PROVIDER_NOT_CONFIGURED');
    }

    const tokenResponse = await fetch(githubTokenUrl, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: env.OAUTH_GITHUB_CLIENT_ID,
        client_secret: env.OAUTH_GITHUB_CLIENT_SECRET,
        redirect_uri: env.OAUTH_GITHUB_CALLBACK_URL,
      }),
    });

    if (!tokenResponse.ok) {
      throw domainError('AUTH_OAUTH_CALLBACK_FAILED');
    }

    const tokens = (await tokenResponse.json()) as GitHubTokenResponse;
    if (!tokens.access_token || tokens.error) {
      throw domainError('AUTH_OAUTH_CALLBACK_FAILED');
    }

    const userResponse = await fetch(githubUserUrl, {
      headers: {
        ...githubHeaders,
        authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const emailsResponse = await fetch(githubEmailsUrl, {
      headers: {
        ...githubHeaders,
        authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok || !emailsResponse.ok) {
      throw domainError('AUTH_OAUTH_CALLBACK_FAILED');
    }

    const user = (await userResponse.json()) as GitHubUser;
    const emails = (await emailsResponse.json()) as GitHubEmail[];
    const email =
      emails.find((candidate) => candidate.primary && candidate.verified) ??
      emails.find((candidate) => candidate.verified);

    if (!email) {
      throw domainError('AUTH_OAUTH_CALLBACK_FAILED');
    }

    return {
      providerAccountId: String(user.id),
      email: email.email.toLowerCase(),
      emailVerified: email.verified,
      name: user.name ?? user.login,
      imageUrl: user.avatar_url ?? null,
      accessToken: tokens.access_token,
      refreshToken: null,
      expiresAt: null,
    };
  },
};
