import * as templates from '../utils/emailTemplates.js';

export default class EmailService {
  /**
   * @param {import('./providers/EmailProvider.js').default} emailProvider
   */
  constructor(emailProvider) {
    if (!emailProvider) {
      throw new Error('An EmailProvider instance must be injected into EmailService');
    }
    this.provider = emailProvider;
  }

  async sendVerificationEmail({ to, name, verificationLink }) {
    return this.provider.sendEmail({
      to,
      recipientName: name,
      subject: 'Verify your KindHeart account',
      html: templates.getVerificationTemplate(name, verificationLink),
    });
  }

  async sendWelcomeEmail({ to, name }) {
    return this.provider.sendEmail({
      to,
      recipientName: name,
      subject: 'Welcome to KindHeart!',
      html: templates.getWelcomeTemplate(name),
    });
  }

  async sendResetPasswordEmail({ to, name, resetLink }) {
    return this.provider.sendEmail({
      to,
      recipientName: name,
      subject: 'Reset your KindHeart password',
      html: templates.getResetPasswordTemplate(name, resetLink),
    });
  }

  async sendResetSuccessEmail({ to, name }) {
    return this.provider.sendEmail({
      to,
      recipientName: name,
      subject: 'Password reset successful',
      html: templates.getResetSuccessTemplate(name),
    });
  }

  async sendContactEmail({ to, fromName, fromEmail, subject, message }) {
    return this.provider.sendEmail({
      to,
      recipientName: 'KindHeart Support',
      subject,
      html: templates.getContactTemplate({ name: fromName, email: fromEmail, subject, message }),
    });
  }
}
