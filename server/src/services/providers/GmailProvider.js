import { google } from 'googleapis';
import EmailProvider from './EmailProvider.js';
import logger from '../../config/logger.js';

const MAIL_FROM = process.env.MAIL_FROM || 'KindHeart <noreply@kindheart.org>';

export default class GmailProvider extends EmailProvider {
  constructor() {
    super();
    this.clientId = process.env.GMAIL_CLIENT_ID;
    this.clientSecret = process.env.GMAIL_CLIENT_SECRET;
    this.refreshToken = process.env.GMAIL_REFRESH_TOKEN;
    this.gmailUser = process.env.GMAIL_USER;

    if (!this.clientId || !this.clientSecret || !this.refreshToken || !this.gmailUser) {
      logger.warn('Gmail OAuth credentials missing in .env. GmailProvider will fail to send emails.');
    } else {
      this.oauth2Client = new google.auth.OAuth2(
        this.clientId,
        this.clientSecret,
        'https://developers.google.com/oauthplayground' // Default redirect URL
      );
      this.oauth2Client.setCredentials({
        refresh_token: this.refreshToken
      });
      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
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
    // Return formatted string for raw email header
    // Gmail API usually enforces the sender email to match the authenticated user
    return `${fromName} <${this.gmailUser}>`;
  }

  async sendEmail({ to, subject, html, recipientName = 'User' }) {
    try {
      if (!this.gmail) {
        throw new Error("GmailProvider is not configured correctly (missing credentials).");
      }

      const sender = this.parseMailFrom();
      
      const rawMessage = [
        `From: ${sender}`,
        `To: ${recipientName} <${to}>`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=utf-8`,
        ``,
        html,
      ].join('\n');

      const encodedMessage = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      return response.data;
    } catch (error) {
      logger.error(`GmailProvider email delivery failed: ${error.message}`);
      throw error;
    }
  }
}
