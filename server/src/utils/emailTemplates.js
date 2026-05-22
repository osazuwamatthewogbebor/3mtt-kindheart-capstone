const APP_NAME = 'KindHeart';
const PRIMARY_COLOR = '#064e3b';
const SECONDARY_COLOR = '#059669';
const TEXT_COLOR = '#374151';

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: ${TEXT_COLOR}; margin: 0; padding: 0; background-color: #f3f4f6; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background-color: ${PRIMARY_COLOR}; padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; }
    .content { padding: 40px; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
    .button { display: inline-block; padding: 14px 30px; background-color: ${SECONDARY_COLOR}; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .divider { height: 1px; background-color: #e5e7eb; margin: 25px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${APP_NAME}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; 2026 ${APP_NAME} Crowdfunding. All rights reserved.</p>
      <p>Helping hearts find their way.</p>
    </div>
  </div>
</body>
</html>
`;

export const getVerificationTemplate = (name, link) => baseTemplate(`
  <h2 style="color: ${PRIMARY_COLOR};">Welcome, ${name}!</h2>
  <p>Thank you for joining <strong>${APP_NAME}</strong>. We're excited to have you on board!</p>
  <p>To start creating campaigns and supporting projects, please verify your email address by clicking the button below:</p>
  <div style="text-align: center;">
    <a href="${link}" class="button">Verify My Email</a>
  </div>
  <p style="font-size: 14px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
  <p style="font-size: 12px; color: ${SECONDARY_COLOR}; word-break: break-all;">${link}</p>
  <div class="divider"></div>
  <p>This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
`);

export const getWelcomeTemplate = (name) => baseTemplate(`
  <h2 style="color: ${PRIMARY_COLOR};">Verification Successful!</h2>
  <p>Hi ${name}, your email has been successfully verified.</p>
  <p>Your account is now fully active. You can now start creating crowdfunding campaigns, donating to projects, and making a difference in the world.</p>
  <div style="text-align: center;">
    <a href="${process.env.FRONTEND_URL || '#'}" class="button">Go to Dashboard</a>
  </div>
  <div class="divider"></div>
  <p>We're happy to have you as part of our community!</p>
`);

export const getResetPasswordTemplate = (name, link) => baseTemplate(`
  <h2 style="color: ${PRIMARY_COLOR};">Password Reset Request</h2>
  <p>Hello ${name},</p>
  <p>We received a request to reset your password for your <strong>${APP_NAME}</strong> account. Click the button below to set a new password:</p>
  <div style="text-align: center;">
    <a href="${link}" class="button">Reset Password</a>
  </div>
  <p style="font-size: 14px; color: #6b7280;">This link will expire in 15 minutes for your security.</p>
  <div class="divider"></div>
  <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
`);

export const getResetSuccessTemplate = (name) => {
  const frontendUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5500/client';
  const loginLink = `${frontendUrl}/pages/login.html`;
  return baseTemplate(`
  <h2 style="color: ${PRIMARY_COLOR};">Password Changed Successfully</h2>
  <p>Hi ${name},</p>
  <p>Your password for <strong>${APP_NAME}</strong> has been successfully updated.</p>
  <p>If you did not perform this change, please contact our security team immediately.</p>
  <div style="text-align: center;">
    <a href="${loginLink}" class="button">Login Now</a>
  </div>
`);
};
