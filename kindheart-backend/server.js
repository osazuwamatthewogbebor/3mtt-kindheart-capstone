const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// ================== DB ==================
const { pool } = require('./src/config/database');

// ================== ROUTES ==================
const authRoutes = require('./src/routes/authRoutes');
const campaignRoutes = require('./src/routes/campaignRoutes');
const donationRoutes = require('./src/routes/donationRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const userRoutes = require('./src/routes/userRoutes');

// ================== APP INIT ==================
const app = express();

// ================== MIDDLEWARE ==================

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS (DEV SAFE FIX)
app.use(
  cors({
    origin: '*', // prevents dashboard crash in dev
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  })
);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================== ROUTES ==================
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// ================== HEALTH CHECK ==================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'KindHeart API is running',
    time: new Date().toISOString()
  });
});

// ================== ROOT ==================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'KindHeart Crowdfunding API',
    version: '1.0.0'
  });
});

// ================== 404 HANDLER ==================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ================== GLOBAL ERROR HANDLER ==================
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);

  // Multer error
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  // DB error
  if (err.code && err.code.startsWith('22')) {
    return res.status(400).json({
      success: false,
      message: 'Database validation error'
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ================== SERVER START ==================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n======================================');
  console.log('🚀 KindHeart API Running');
  console.log('======================================');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Env: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log('======================================\n');
});

// ================== PROCESS HANDLERS ==================
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Closing server...');

  pool.end(() => {
    console.log('🛑 DB pool closed');
    process.exit(0);
  });
});

module.exports = app;