import { Router } from 'express';
import { authenticate } from '../../../shared/auth/authenticate.js';
import { badRequest } from '../../../shared/errors/app-error.js';
import { asyncHandler } from '../../../shared/http/async-handler.js';
import { authService } from '../application/auth.service.js';
import { loginSchema, logoutSchema, refreshSchema, registerSchema } from './auth.validators.js';

export const authRoutes = Router();

authRoutes.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { body } = registerSchema.parse(req);
    const result = await authService.register(body);
    res.status(201).json(result);
  }),
);

authRoutes.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { body } = loginSchema.parse(req);
    const result = await authService.login(body);
    res.status(200).json(result);
  }),
);

authRoutes.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { body } = refreshSchema.parse(req);
    const result = await authService.refresh(body.refreshToken);
    res.status(200).json(result);
  }),
);

authRoutes.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const { body } = logoutSchema.parse(req);
    await authService.logout(body.refreshToken);
    res.status(204).send();
  }),
);

authRoutes.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw badRequest('Missing auth context');
    }
    const user = await authService.me(req.auth.userId);
    res.status(200).json({ user });
  }),
);

authRoutes.get('/oauth/:provider', (_req, res) => {
  res.status(501).json({
    error: {
      code: 'OAUTH_PROVIDER_NOT_CONFIGURED',
      message: 'OAuth2 route surface is reserved for provider integration.',
    },
  });
});

authRoutes.get('/oauth/:provider/callback', (_req, res) => {
  res.status(501).json({
    error: {
      code: 'OAUTH_PROVIDER_NOT_CONFIGURED',
      message: 'OAuth2 callback surface is reserved for provider integration.',
    },
  });
});
