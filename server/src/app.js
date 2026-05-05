import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import { NODE_ENV } from './config/env.js';
import './config/passport.js';
import authRoutes from './routes/authRoutes.js';
import adminCategoryRoutes from './routes/adminCategoryRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import paymentRoutes from "./routes/paymentRoutes.js";
import notFoundMiddleware from './middlewares/notFoundMiddleware.js';
import errorMiddleware from './middlewares/errorMiddleware.js';
import donationRoutes from './routes/donationRoutes.js'

const app = express();

// Middlewares
app.use(helmet());

// CORS configuration - allow production origins via env var
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5500', 'http://127.0.0.1:5500'];

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

app.use('/api', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// Welcome Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to KindHeart API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/donations', donationRoutes);

// Error Handlers
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
