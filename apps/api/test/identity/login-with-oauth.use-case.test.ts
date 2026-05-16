import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLoginWithOAuthUseCase } from '../../src/modules/identity/application/use-cases/login-with-oauth.use-case.js';
import { oauthStateService } from '../../src/modules/identity/application/oauth-state.service.js';
import type { OAuthProviderClient } from '../../src/modules/identity/application/ports/oauth-provider.port.js';
import type { TokenIssuerService } from '../../src/modules/identity/application/services/token-issuer.service.js';
import type { AuthUser } from '../../src/modules/identity/domain/entities/auth-user.entity.js';
import type {
  OAuthAccountRepository,
  OAuthAccountWithUser,
} from '../../src/modules/identity/domain/repositories/oauth-account.repository.js';
import type { RefreshTokenRepository } from '../../src/modules/identity/domain/repositories/refresh-token.repository.js';
import type { UserRepository } from '../../src/modules/identity/domain/repositories/user.repository.js';

describe('loginWithOAuthUseCase', () => {
  const getGoogleAuthorizationUrl = vi.fn<OAuthProviderClient['getAuthorizationUrl']>();
  const exchangeGoogleCodeForProfile = vi.fn<OAuthProviderClient['exchangeCodeForProfile']>();
  const getGithubAuthorizationUrl = vi.fn<OAuthProviderClient['getAuthorizationUrl']>();
  const exchangeGithubCodeForProfile = vi.fn<OAuthProviderClient['exchangeCodeForProfile']>();
  const findByProvider = vi.fn<OAuthAccountRepository['findByProvider']>();
  const upsertOAuthAccount = vi.fn<OAuthAccountRepository['upsert']>();
  const upsertFromOAuth = vi.fn<UserRepository['upsertFromOAuth']>();
  const issue = vi.fn<TokenIssuerService['issue']>();

  const googleClient: OAuthProviderClient = {
    providerName: 'google',
    getAuthorizationUrl: getGoogleAuthorizationUrl,
    exchangeCodeForProfile: exchangeGoogleCodeForProfile,
  };

  const githubClient: OAuthProviderClient = {
    providerName: 'github',
    getAuthorizationUrl: getGithubAuthorizationUrl,
    exchangeCodeForProfile: exchangeGithubCodeForProfile,
  };

  const mockUserRepo = {
    upsertFromOAuth,
  } as unknown as UserRepository;

  const mockOAuthAccountRepo = {
    findByProvider,
    upsert: upsertOAuthAccount,
  } as unknown as OAuthAccountRepository;

  const mockRefreshTokenRepo = {} as unknown as RefreshTokenRepository;

  const mockTokenIssuer = {
    issue,
  } as unknown as TokenIssuerService;

  const useCase = createLoginWithOAuthUseCase({
    userRepository: mockUserRepo,
    oauthAccountRepository: mockOAuthAccountRepo,
    refreshTokenRepository: mockRefreshTokenRepo,
    tokenIssuer: mockTokenIssuer,
    oauthClients: {
      google: googleClient,
      github: githubClient,
    },
  });

  const oauthUser: AuthUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test',
    imageUrl: 'https://example.com/avatar.png',
    passwordHash: null,
    emailVerified: true,
    createdAt: new Date(),
    deletedAt: null,
  };

  const profile = {
    providerAccountId: 'provider-account-1',
    email: 'test@example.com',
    emailVerified: true,
    name: 'Test',
    imageUrl: 'https://example.com/avatar.png',
    accessToken: 'provider-access',
    refreshToken: 'provider-refresh',
    expiresAt: new Date(Date.now() + 10000),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates authorization URL with signed state', () => {
    getGoogleAuthorizationUrl.mockReturnValueOnce('https://accounts.google.com/oauth');

    const result = useCase.getAuthorizationUrl('google');

    expect(result).toBe('https://accounts.google.com/oauth');
    expect(getGoogleAuthorizationUrl).toHaveBeenCalledTimes(1);
    const state = getGoogleAuthorizationUrl.mock.calls[0]?.[0];
    expect(state).toBeDefined();
    if (!state) {
      throw new Error('Expected OAuth state to be generated');
    }
    expect(oauthStateService.verify(state, 'google').provider).toBe('google');
  });

  it('upserts user and OAuth account, then returns issued tokens for a new OAuth account', async () => {
    const state = oauthStateService.create('google');
    exchangeGoogleCodeForProfile.mockResolvedValueOnce(profile);
    findByProvider.mockResolvedValueOnce(null);
    upsertFromOAuth.mockResolvedValueOnce(oauthUser);
    issue.mockResolvedValueOnce({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      storedRefreshTokenId: 'stored-refresh-token',
    });

    const result = await useCase.execute({
      provider: 'google',
      code: 'oauth-code',
      state,
    });

    expect(exchangeGoogleCodeForProfile).toHaveBeenCalledWith('oauth-code');
    expect(findByProvider).toHaveBeenCalledWith('google', 'provider-account-1');
    expect(upsertFromOAuth).toHaveBeenCalledWith({
      email: 'test@example.com',
      name: 'Test',
      imageUrl: 'https://example.com/avatar.png',
      emailVerified: true,
    });
    expect(upsertOAuthAccount).toHaveBeenCalledWith({
      userId: 'user-1',
      provider: 'google',
      providerAccountId: 'provider-account-1',
      imageUrl: 'https://example.com/avatar.png',
      accessToken: 'provider-access',
      refreshToken: 'provider-refresh',
      expiresAt: profile.expiresAt,
    });
    expect(issue).toHaveBeenCalledWith(oauthUser, mockRefreshTokenRepo);
    expect(result.tokens).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(result.user.id).toBe('user-1');
  });

  it('uses existing OAuth account user data and preserves old provider refresh token when provider omits it', async () => {
    const state = oauthStateService.create('github');
    const existingAccount: OAuthAccountWithUser = {
      id: 'account-1',
      userId: 'user-1',
      provider: 'github',
      providerAccountId: 'provider-account-1',
      imageUrl: 'https://example.com/old-avatar.png',
      accessToken: 'old-access',
      refreshToken: 'old-refresh',
      expiresAt: null,
      deletedAt: null,
      user: {
        id: 'user-1',
        email: 'existing@example.com',
        name: 'Existing',
        imageUrl: 'https://example.com/old-avatar.png',
        emailVerified: false,
        deletedAt: null,
      },
    };

    exchangeGithubCodeForProfile.mockResolvedValueOnce({
      ...profile,
      refreshToken: null,
    });
    findByProvider.mockResolvedValueOnce(existingAccount);
    upsertFromOAuth.mockResolvedValueOnce({
      ...oauthUser,
      email: 'existing@example.com',
      name: 'Existing',
      imageUrl: 'https://example.com/old-avatar.png',
    });
    issue.mockResolvedValueOnce({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      storedRefreshTokenId: 'stored-refresh-token',
    });

    await useCase.execute({
      provider: 'github',
      code: 'oauth-code',
      state,
    });

    expect(upsertFromOAuth).toHaveBeenCalledWith({
      email: 'existing@example.com',
      name: 'Existing',
      imageUrl: 'https://example.com/old-avatar.png',
      emailVerified: true,
    });
    expect(upsertOAuthAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        provider: 'github',
        refreshToken: 'old-refresh',
      }),
    );
  });

  it('rejects invalid OAuth state before exchanging provider code', async () => {
    await expect(
      useCase.execute({
        provider: 'google',
        code: 'oauth-code',
        state: 'bad-state',
      }),
    ).rejects.toHaveProperty('code', 'AUTH_OAUTH_INVALID_STATE');

    expect(exchangeGoogleCodeForProfile).not.toHaveBeenCalled();
  });
});
