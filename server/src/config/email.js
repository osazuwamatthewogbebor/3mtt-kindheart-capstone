import EmailService from '../services/emailService.js';
import BrevoProvider from '../services/providers/BrevoProvider.js';
import GmailProvider from '../services/providers/GmailProvider.js';

// By default, we can use Brevo if process.env.EMAIL_PROVIDER is not set
// or use Gmail if EMAIL_PROVIDER=gmail
const getEmailProvider = () => {
  const providerName = process.env.EMAIL_PROVIDER?.toLowerCase() || 'brevo';
  
  if (providerName === 'gmail') {
    return new GmailProvider();
  }
  
  // Default to Brevo
  return new BrevoProvider();
};

const emailProvider = getEmailProvider();
export const emailService = new EmailService(emailProvider);
