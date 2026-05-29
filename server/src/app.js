import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import './config/passport.js';
import authRoutes from './routes/authRoutes.js';
import adminCategoryRoutes from './routes/adminCategoryRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import adminStatsRoutes from './routes/adminStatsRoutes.js';
import publicStatsRoutes from './routes/publicStatsRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';

import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import paymentRoutes from "./routes/paymentRoutes.js";
import notFoundMiddleware from './middlewares/notFoundMiddleware.js';
import errorMiddleware from './middlewares/errorMiddleware.js';
import donationRoutes from './routes/donationRoutes.js'
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { gatekeeper } from './middlewares/gatekeeperMiddleware.js';
import { healthcare } from 'googleapis/build/src/apis/healthcare/index.js';

const app = express();

// Trust proxy for Render/Cloud environments (fixes rate-limit issues)
app.set('trust proxy', 1);

// Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://validator.swagger.io"],
      connectSrc: ["'self'"],
    },
  },
}));

// CORS configuration - allow production origins via env var
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));


app.use(passport.initialize());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

// Rate Limiting - global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

// Stricter rate limiting for sensitive auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: false,
});

// Strict rate limiting for admin endpoints
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many admin requests, please try again later',
  skipSuccessfulRequests: false,
});

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: "Server is awake and running" })
})

app.use('/api', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to KindHeart API' });
});

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: "Server is awake and running" })
})

// API Documentation
app.use('/api-docs', gatekeeper, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/stats', publicStatsRoutes);
app.use('/api/admin', adminLimiter);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminStatsRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/donations', donationRoutes);

// Error Handlers
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
