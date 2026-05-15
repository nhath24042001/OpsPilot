import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1).max(100).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

export const logoutSchema = refreshSchema;

export const verifyEmailSchema = z.object({
  query: z.object({
    token: z.string().min(1),
  }),
});

export const resendVerificationEmailSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const forgotPasswordSchema = resendVerificationEmailSchema;

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    password: z.string().min(8),
  }),
});

export const oauthParamsSchema = z.object({
  params: z.object({
    provider: z.enum(['google', 'github']),
  }),
});

export const oauthCallbackSchema = oauthParamsSchema.extend({
  query: z.object({
    code: z.string().min(1),
    state: z.string().min(1),
  }),
});
