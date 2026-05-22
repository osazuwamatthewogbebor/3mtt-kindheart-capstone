import EmailProvider from './EmailProvider.js';
import logger from '../../config/logger.js';

const MAIL_FROM = process.env.MAIL_FROM || 'KindHeart <noreply@kindheart.org>';

export default class BrevoProvider extends EmailProvider {
  constructor() {
    super();
    this.apiKey = process.env.BREVO_API_KEY;
    if (!this.apiKey) {
      logger.warn('BREVO_API_KEY is missing. BrevoProvider will fail to send emails.');
    }
  }

  parseMailFrom() {
    let fromEmail = MAIL_FROM;
    let fromName = 'KindHeart';
    if (MAIL_FROM.includes('<')) {
      const match = MAIL_FROM.match(/(.*)<(.*)>/);
      if (match) {
        fromName = match[1].trim();
        fromEmail = match[2].trim();
      }
    }
    return { name: fromName, email: fromEmail };
  }

  async sendEmail({ to, subject, html, recipientName = 'User' }) {
    try {
      if (!this.apiKey) {
        throw new Error('BrevoProvider is not configured correctly (missing API key).');
      }

      const { name: senderName, email: senderEmail } = this.parseMailFrom();

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to, name: recipientName }],
          subject: subject,
          htmlContent: html
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }
      return data;
    } catch (error) {
      logger.error(`BrevoProvider email delivery failed: ${error.message}`);
      throw error;
    }
  }
}
