import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const MAIL_FROM = process.env.MAIL_FROM || 'no-reply@kindheart.local';

const getTransporter = () => {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Missing SMTP configuration. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

export const sendVerificationEmail = async ({ to, name, verificationLink }) => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject: 'Verify your email address',
    text: `Hi ${name}, verify your email by opening this link: ${verificationLink}`,
    html: `<p>Hi ${name},</p><p>Verify your email by clicking the link below:</p><p><a href="${verificationLink}">${verificationLink}</a></p>`,
  });
};
