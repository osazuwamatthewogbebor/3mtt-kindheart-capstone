const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Generate JWT Token
exports.generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send Email
exports.sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `KindHeart <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.message
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', options.email);
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Email could not be sent');
  }
};

// Generate password reset token
exports.generateResetToken = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

// Format currency
exports.formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount);
};

// Calculate campaign progress percentage
exports.calculateProgress = (raised, goal) => {
  if (goal === 0) return 0;
  return Math.min(Math.round((raised / goal) * 100), 100);
};
