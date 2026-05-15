import { Router } from 'express';
import { authenticate } from '../../../shared/auth/authenticate.js';
import { asyncHandler } from '../../../shared/http/async-handler.js';
import { authController } from './auth.controller.js';

export const authRoutes = Router();

authRoutes.post('/register', asyncHandler(authController.register));

authRoutes.post('/login', asyncHandler(authController.login));

authRoutes.get('/verify-email', asyncHandler(authController.verifyEmail));

authRoutes.post('/resend-verification-email', asyncHandler(authController.resendVerificationEmail));

authRoutes.post('/forgot-password', asyncHandler(authController.forgotPassword));

authRoutes.post('/reset-password', asyncHandler(authController.resetPassword));

authRoutes.post('/refresh', asyncHandler(authController.refresh));

authRoutes.post('/logout', asyncHandler(authController.logout));

authRoutes.get('/me', authenticate, asyncHandler(authController.me));

authRoutes.get('/oauth/:provider', asyncHandler(authController.startOAuth));

authRoutes.get('/oauth/:provider/callback', asyncHandler(authController.handleOAuthCallback));
