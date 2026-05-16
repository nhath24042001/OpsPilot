import type { Request, Response } from 'express';
import { getAuthContext } from '../../../shared/auth/auth-context.js';
import { identityModule } from '../identity.module.js';
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  oauthCallbackSchema,
  oauthParamsSchema,
  refreshSchema,
  registerSchema,
  resendVerificationEmailSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.validators.js';

export const authController = {
  async register(req: Request, res: Response) {
    const { body } = registerSchema.parse(req);
    const result = await identityModule.authService.register(body);
    res.status(201).json(result);
  },

  async login(req: Request, res: Response) {
    const { body } = loginSchema.parse(req);
    const result = await identityModule.authService.loginWithPassword(body);
    res.status(200).json(result);
  },

  async verifyEmail(req: Request, res: Response) {
    const { query } = verifyEmailSchema.parse(req);
    const result = await identityModule.authService.verifyEmail({ token: query.token });
    res.status(200).json(result);
  },

  async resendVerificationEmail(req: Request, res: Response) {
    const { body } = resendVerificationEmailSchema.parse(req);
    const result = await identityModule.authService.resendVerification(body);
    res.status(202).json(result);
  },

  async forgotPassword(req: Request, res: Response) {
    const { body } = forgotPasswordSchema.parse(req);
    const result = await identityModule.authService.forgotPassword(body);
    res.status(202).json(result);
  },

  async resetPassword(req: Request, res: Response) {
    const { body } = resetPasswordSchema.parse(req);
    const result = await identityModule.authService.resetPassword(body);
    res.status(200).json(result);
  },

  async refresh(req: Request, res: Response) {
    const { body } = refreshSchema.parse(req);
    const result = await identityModule.authService.refreshToken({ refreshToken: body.refreshToken });
    res.status(200).json(result);
  },

  async logout(req: Request, res: Response) {
    const { body } = logoutSchema.parse(req);
    await identityModule.authService.logout({ refreshToken: body.refreshToken });
    res.status(204).send();
  },

  async me(req: Request, res: Response) {
    const auth = getAuthContext(req);
    const user = await identityModule.authService.getCurrentUser(auth.userId);
    res.status(200).json({ user });
  },

  startOAuth(req: Request, res: Response) {
    const { params } = oauthParamsSchema.parse(req);
    res.redirect(identityModule.authService.getOAuthAuthorizationUrl(params.provider));
  },

  async handleOAuthCallback(req: Request, res: Response) {
    const { params, query } = oauthCallbackSchema.parse(req);
    const result = await identityModule.authService.loginWithOAuth({
      provider: params.provider,
      code: query.code,
      state: query.state,
    });
    res.status(200).json(result);
  },
};
