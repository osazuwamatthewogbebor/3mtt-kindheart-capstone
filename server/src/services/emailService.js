import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import * as templates from '../utils/emailTemplates.js';
import logger from '../config/logger.js';

const MAIL_FROM = process.env.MAIL_FROM || 'KindHeart <[EMAIL_ADDRESS]>';

/**
 * Generic send email function using MailerSend
 */
const sendEmail = async ({ to, subject, html, recipientName = 'User' }) => {
  try {
    const apiKey = process.env.MAILERSEND_API_KEY;
    if (!apiKey) {
      logger.warn('MAILERSEND_API_KEY is missing. Email not sent.');
      return null;
    }

    const mailersend = new MailerSend({ apiKey });

    // Parse MAIL_FROM to separate name and email if formatted like "Name <email@xxx.com>"
    let fromEmail = MAIL_FROM;
    let fromName = 'KindHeart';

    if (MAIL_FROM.includes('<')) {
      const match = MAIL_FROM.match(/(.*)<(.*)>/);
      if (match) {
        fromName = match[1].trim();
        fromEmail = match[2].trim();
      }
    }

    logger.info(`Sending email from: ${fromEmail} (${fromName})`);
    const sentFrom = new Sender(fromEmail, fromName);
    const recipients = [new Recipient(to, recipientName)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject(subject)
      .setHtml(html);

    const response = await mailersend.email.send(emailParams);
    return response;
  } catch (error) {
    // Log the full error object as MailerSend errors can be complex
    const errorMessage = error.message || (error.body ? JSON.stringify(error.body) : JSON.stringify(error));
    logger.error(`Email delivery failed: ${errorMessage}`);
    throw new Error(errorMessage);
  }
};

export const sendVerificationEmail = async ({ to, name, verificationLink }) => {
  return sendEmail({
    to,
    recipientName: name,
    subject: 'Verify your KindHeart account',
    html: templates.getVerificationTemplate(name, verificationLink),
  });
};

export const sendWelcomeEmail = async ({ to, name }) => {
  return sendEmail({
    to,
    recipientName: name,
    subject: 'Welcome to KindHeart!',
    html: templates.getWelcomeTemplate(name),
  });
};

export const sendResetPasswordEmail = async ({ to, name, resetLink }) => {
  return sendEmail({
    to,
    recipientName: name,
    subject: 'Reset your KindHeart password',
    html: templates.getResetPasswordTemplate(name, resetLink),
  });
};

export const sendResetSuccessEmail = async ({ to, name }) => {
  return sendEmail({
    to,
    recipientName: name,
    subject: 'Password reset successful',
    html: templates.getResetSuccessTemplate(name),
  });
};
