import { Resend } from 'resend';
import * as templates from '../utils/emailTemplates.js';
import logger from '../config/logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const MAIL_FROM = process.env.MAIL_FROM || 'onboarding@resend.dev';

/**
 * Generic send email function using Resend
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      logger.warn('RESEND_API_KEY is missing. Email not sent.');
      return null;
    }

    const { data, error } = await resend.emails.send({
      from: MAIL_FROM.includes('<') ? MAIL_FROM : `KindHeart <${MAIL_FROM}>`,
      to: [to],
      subject,
      html,
    });

    if (error) {
      logger.error(`Resend error: ${JSON.stringify(error)}`);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    logger.error(`Email delivery failed: ${error.message}`);
    throw error;
  }
};

export const sendVerificationEmail = async ({ to, name, verificationLink }) => {
  return sendEmail({
    to,
    subject: 'Verify your KindHeart account',
    html: templates.getVerificationTemplate(name, verificationLink),
  });
};

export const sendWelcomeEmail = async ({ to, name }) => {
  return sendEmail({
    to,
    subject: 'Welcome to KindHeart!',
    html: templates.getWelcomeTemplate(name),
  });
};

export const sendResetPasswordEmail = async ({ to, name, resetLink }) => {
  return sendEmail({
    to,
    subject: 'Reset your KindHeart password',
    html: templates.getResetPasswordTemplate(name, resetLink),
  });
};

export const sendResetSuccessEmail = async ({ to, name }) => {
  return sendEmail({
    to,
    subject: 'Password reset successful',
    html: templates.getResetSuccessTemplate(name),
  });
};
