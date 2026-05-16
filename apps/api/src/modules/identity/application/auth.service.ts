import type { createGetCurrentUserUseCase } from './use-cases/get-current-user.use-case.js';
import type { createLoginWithPasswordUseCase } from './use-cases/login-with-password.use-case.js';
import type { createRegisterUseCase } from './use-cases/register.use-case.js';
import type { createVerifyEmailUseCase } from './use-cases/verify-email.use-case.js';
import type { createResendVerificationUseCase } from './use-cases/resend-verification.use-case.js';
import type { createForgotPasswordUseCase } from './use-cases/forgot-password.use-case.js';
import type { createResetPasswordUseCase } from './use-cases/reset-password.use-case.js';
import type { createRefreshTokenUseCase } from './use-cases/refresh-token.use-case.js';
import type { createLogoutUseCase } from './use-cases/logout.use-case.js';
import type { createLoginWithOAuthUseCase } from './use-cases/login-with-oauth.use-case.js';

export type IdentityUseCases = {
  getCurrentUser: ReturnType<typeof createGetCurrentUserUseCase>;
  loginWithPassword: ReturnType<typeof createLoginWithPasswordUseCase>;
  register: ReturnType<typeof createRegisterUseCase>;
  verifyEmail: ReturnType<typeof createVerifyEmailUseCase>;
  resendVerification: ReturnType<typeof createResendVerificationUseCase>;
  forgotPassword: ReturnType<typeof createForgotPasswordUseCase>;
  resetPassword: ReturnType<typeof createResetPasswordUseCase>;
  refreshToken: ReturnType<typeof createRefreshTokenUseCase>;
  logout: ReturnType<typeof createLogoutUseCase>;
  loginWithOAuth: ReturnType<typeof createLoginWithOAuthUseCase>;
};

export const createAuthService = (useCases: IdentityUseCases) => ({
  getCurrentUser: useCases.getCurrentUser.execute,
  loginWithPassword: useCases.loginWithPassword.execute,
  register: useCases.register.execute,
  verifyEmail: useCases.verifyEmail.execute,
  resendVerification: useCases.resendVerification.execute,
  forgotPassword: useCases.forgotPassword.execute,
  resetPassword: useCases.resetPassword.execute,
  refreshToken: useCases.refreshToken.execute,
  logout: useCases.logout.execute,

  getOAuthAuthorizationUrl: useCases.loginWithOAuth.getAuthorizationUrl,
  loginWithOAuth: useCases.loginWithOAuth.execute,
});
