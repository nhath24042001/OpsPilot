import { Router } from 'express';
import { authenticate } from '../../../shared/auth/authenticate.js';
import { asyncHandler } from '../../../shared/http/async-handler.js';
import { authController } from './auth.controller.js';

export const authRoutes = Router();

authRoutes.post('/register', asyncHandler(authController.register.bind(authController)));

authRoutes.post('/login', asyncHandler(authController.login.bind(authController)));

authRoutes.get('/verify-email', asyncHandler(authController.verifyEmail.bind(authController)));

authRoutes.post('/resend-verification-email', asyncHandler(authController.resendVerificationEmail.bind(authController)));

authRoutes.post('/forgot-password', asyncHandler(authController.forgotPassword.bind(authController)));

authRoutes.post('/reset-password', asyncHandler(authController.resetPassword.bind(authController)));

authRoutes.post('/refresh', asyncHandler(authController.refresh.bind(authController)));

authRoutes.post('/logout', asyncHandler(authController.logout.bind(authController)));

authRoutes.get('/me', authenticate, asyncHandler(authController.me.bind(authController)));

authRoutes.get('/oauth/:provider', authController.startOAuth.bind(authController));

authRoutes.get('/oauth/:provider/callback', asyncHandler(authController.handleOAuthCallback.bind(authController)));
