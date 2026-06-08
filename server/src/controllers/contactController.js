import { emailService } from '../config/email.js';

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@kindheart.org';

export const submitContactForm = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    await emailService.sendContactEmail({
      to: SUPPORT_EMAIL,
      fromName: name,
      fromEmail: email,
      subject: `KindHeart Support Request: ${subject}`,
      message,
    });

    res.status(200).json({
      success: true,
      message: 'Your message has been sent. Our support team will reply shortly.',
    });
  } catch (error) {
    next(error);
  }
};
