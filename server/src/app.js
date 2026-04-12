import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import notFoundMiddleware from './middlewares/notFoundMiddleware.js';
import errorMiddleware from './middlewares/errorMiddleware.js';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5500',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api', limiter);

// Welcome Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to KindHeart API' });
});

// Error Handlers
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
