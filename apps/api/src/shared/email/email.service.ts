import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../logger/logger.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

const from = `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM}>`;

export const emailService = {
  async sendVerificationEmail(input: { to: string; name?: string | null; token: string }) {
    const verifyUrl = `${env.API_PUBLIC_URL}/auth/verify-email?token=${input.token}`;

    await transporter.sendMail({
      from,
      to: input.to,
      subject: 'Verify your OpsPilot email',
      text: `Hi ${input.name ?? 'there'}, verify your email: ${verifyUrl}`,
      html: `<p>Hi ${input.name ?? 'there'},</p><p>Verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });

    logger.info({ to: input.to }, 'Verification email sent');
  },

  async sendPasswordResetEmail(input: { to: string; name?: string | null; token: string }) {
    const resetUrl = `${env.WEB_APP_URL}/reset-password?token=${input.token}`;

    await transporter.sendMail({
      from,
      to: input.to,
      subject: 'Reset your OpsPilot password',
      text: `Hi ${input.name ?? 'there'}, reset your password: ${resetUrl}`,
      html: `<p>Hi ${input.name ?? 'there'},</p><p>Reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });

    logger.info({ to: input.to }, 'Password reset email sent');
  },
};
