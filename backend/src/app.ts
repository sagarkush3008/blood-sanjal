import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.config';
import { requestIdMiddleware } from './core/middleware/requestId.middleware';
import { errorMiddleware } from './core/middleware/error.middleware';
import { notFoundMiddleware } from './core/middleware/notFound.middleware';
import authRoutes from './modules/auth/auth.routes';
import { SuccessResponse } from './core/http/result';
import { logger } from './config/logger.config';

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: env.CORS_ORIGINS === '*' ? '*' : env.CORS_ORIGINS.split(','),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Request ID Middleware
app.use(requestIdMiddleware);

// Request logger
app.use((req, res, next) => {
  logger.info(`[${req.id}] ${req.method} ${req.url}`);
  next();
});

// Body parsing with size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' } }
});
app.use(limiter);

// Health and Readiness
app.get('/health', (req, res) => {
  res.status(200).json(SuccessResponse({ status: 'UP' }, req.id));
});
app.get('/ready', (req, res) => {
  res.status(200).json(SuccessResponse({ status: 'READY' }, req.id));
});

// Routes
app.use('/api/v1/auth', authRoutes);

// 404 Handler
app.use(notFoundMiddleware);

// Global Error Handler
app.use(errorMiddleware);

export default app;
