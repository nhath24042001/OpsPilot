import { env } from '../../shared/config/env.js';
import { emailService } from '../../shared/email/email.service.js';
import { createAuthService } from './application/auth.service.js';
import { createTokenIssuerService } from './application/services/token-issuer.service.js';
import { createForgotPasswordUseCase } from './application/use-cases/forgot-password.use-case.js';
import { createGetCurrentUserUseCase } from './application/use-cases/get-current-user.use-case.js';
import { createLoginWithOAuthUseCase } from './application/use-cases/login-with-oauth.use-case.js';
import { createLoginWithPasswordUseCase } from './application/use-cases/login-with-password.use-case.js';
import { createLogoutUseCase } from './application/use-cases/logout.use-case.js';
import { createRefreshTokenUseCase } from './application/use-cases/refresh-token.use-case.js';
import { createRegisterUseCase } from './application/use-cases/register.use-case.js';
import { createResendVerificationUseCase } from './application/use-cases/resend-verification.use-case.js';
import { createResetPasswordUseCase } from './application/use-cases/reset-password.use-case.js';
import { createVerifyEmailUseCase } from './application/use-cases/verify-email.use-case.js';
import { githubOAuthClient } from './infrastructure/oauth/github.oauth-client.js';
import { googleOAuthClient } from './infrastructure/oauth/google.oauth-client.js';
import { prismaAuthTokenRepository } from './infrastructure/prisma/prisma-auth-token.repository.js';
import { prismaOAuthAccountRepository } from './infrastructure/prisma/prisma-oauth-account.repository.js';
import { prismaRefreshTokenRepository } from './infrastructure/prisma/prisma-refresh-token.repository.js';
import { prismaUserRepository } from './infrastructure/prisma/prisma-user.repository.js';

export const createIdentityModule = () => {
  const userRepository = prismaUserRepository;
  const refreshTokenRepository = prismaRefreshTokenRepository;
  const authTokenRepository = prismaAuthTokenRepository;
  const oauthAccountRepository = prismaOAuthAccountRepository;

  const oauthClients = {
    google: googleOAuthClient,
    github: githubOAuthClient,
  };

  const tokenIssuer = createTokenIssuerService();

  const useCases = {
    getCurrentUser: createGetCurrentUserUseCase({ userRepository }),

    loginWithPassword: createLoginWithPasswordUseCase({
      userRepository,
      refreshTokenRepository,
      tokenIssuer,
    }),

    register: createRegisterUseCase({
      userRepository,
      authTokenRepository,
      emailService,
      emailVerificationTtlMinutes: env.EMAIL_VERIFICATION_TTL_MINUTES,
    }),

    verifyEmail: createVerifyEmailUseCase({ authTokenRepository }),

    resendVerification: createResendVerificationUseCase({
      userRepository,
      authTokenRepository,
      emailService,
      emailVerificationTtlMinutes: env.EMAIL_VERIFICATION_TTL_MINUTES,
    }),

    forgotPassword: createForgotPasswordUseCase({
      userRepository,
      authTokenRepository,
      emailService,
      passwordResetTtlMinutes: env.PASSWORD_RESET_TTL_MINUTES,
    }),

    resetPassword: createResetPasswordUseCase({
      authTokenRepository,
      userRepository,
      refreshTokenRepository,
    }),

    refreshToken: createRefreshTokenUseCase({
      refreshTokenRepository,
      userRepository,
      tokenIssuer,
    }),

    logout: createLogoutUseCase({ refreshTokenRepository }),

    loginWithOAuth: createLoginWithOAuthUseCase({
      userRepository,
      oauthAccountRepository,
      refreshTokenRepository,
      tokenIssuer,
      oauthClients,
    }),
  };

  const authService = createAuthService(useCases);

  return {
    authService,
  };
};

export const identityModule = createIdentityModule();
