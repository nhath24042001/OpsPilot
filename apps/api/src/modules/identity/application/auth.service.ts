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
  getCurrentUser: useCases.getCurrentUser.execute.bind(useCases.getCurrentUser),
  loginWithPassword: useCases.loginWithPassword.execute.bind(useCases.loginWithPassword),
  register: useCases.register.execute.bind(useCases.register),
  verifyEmail: useCases.verifyEmail.execute.bind(useCases.verifyEmail),
  resendVerification: useCases.resendVerification.execute.bind(useCases.resendVerification),
  forgotPassword: useCases.forgotPassword.execute.bind(useCases.forgotPassword),
  resetPassword: useCases.resetPassword.execute.bind(useCases.resetPassword),
  refreshToken: useCases.refreshToken.execute.bind(useCases.refreshToken),
  logout: useCases.logout.execute.bind(useCases.logout),

  getOAuthAuthorizationUrl: useCases.loginWithOAuth.getAuthorizationUrl.bind(useCases.loginWithOAuth),
  loginWithOAuth: useCases.loginWithOAuth.execute.bind(useCases.loginWithOAuth),
});
