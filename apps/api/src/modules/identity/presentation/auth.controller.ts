import type { Request, Response } from 'express';
import { getAuthContext } from '../../../shared/auth/auth-context.js';
import { authService } from '../application/auth.service.js';
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
    const result = await authService.register(body);
    res.status(201).json(result);
  },

  async login(req: Request, res: Response) {
    const { body } = loginSchema.parse(req);
    const result = await authService.login(body);
    res.status(200).json(result);
  },

  async verifyEmail(req: Request, res: Response) {
    const { query } = verifyEmailSchema.parse(req);
    const result = await authService.verifyEmail(query.token);
    res.status(200).json(result);
  },

  async resendVerificationEmail(req: Request, res: Response) {
    const { body } = resendVerificationEmailSchema.parse(req);
    const result = await authService.resendVerificationEmail(body);
    res.status(202).json(result);
  },

  async forgotPassword(req: Request, res: Response) {
    const { body } = forgotPasswordSchema.parse(req);
    const result = await authService.forgotPassword(body);
    res.status(202).json(result);
  },

  async resetPassword(req: Request, res: Response) {
    const { body } = resetPasswordSchema.parse(req);
    const result = await authService.resetPassword(body);
    res.status(200).json(result);
  },

  async refresh(req: Request, res: Response) {
    const { body } = refreshSchema.parse(req);
    const result = await authService.refresh(body.refreshToken);
    res.status(200).json(result);
  },

  async logout(req: Request, res: Response) {
    const { body } = logoutSchema.parse(req);
    await authService.logout(body.refreshToken);
    res.status(204).send();
  },

  async me(req: Request, res: Response) {
    const auth = getAuthContext(req);
    const user = await authService.me(auth.userId);
    res.status(200).json({ user });
  },

  async startOAuth(req: Request, res: Response) {
    const { params } = oauthParamsSchema.parse(req);
    res.redirect(authService.getOAuthAuthorizationUrl(params.provider));
  },

  async handleOAuthCallback(req: Request, res: Response) {
    const { params, query } = oauthCallbackSchema.parse(req);
    const result = await authService.handleOAuthCallback({
      provider: params.provider,
      code: query.code,
      state: query.state,
    });
    res.status(200).json(result);
  },
};
