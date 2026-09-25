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
import userRoutes from './modules/users/user.routes';
import donorRoutes from './modules/donors/donor.routes';
import requestRoutes from './modules/requests/bloodRequest.routes';
import contactRequestRoutes from './modules/requests/contactRequest.routes';
import paymentRoutes from './modules/payments/payment.routes';
import donationRoutes from './modules/donors/donation.routes';
import reminderRoutes from './modules/reminders/reminder.routes';
import campaignRoutes from './modules/campaigns/campaign.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import rewardRoutes from './modules/rewards/reward.routes';
import certificateRoutes from './modules/certificates/certificate.routes';
import adminRoutes from './modules/admin/admin.routes';
import locationRoutes from './modules/locations/location.routes';
import mediaRoutes from './modules/media/media.routes';
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
app.use('/api/v1/me', userRoutes);
app.use('/api/v1/donors', donorRoutes);
app.use('/api/v1/donations', donationRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/contact-requests', contactRequestRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reminders', reminderRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/rewards', rewardRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/media', mediaRoutes);

// 404 Handler
app.use(notFoundMiddleware);

// Global Error Handler
app.use(errorMiddleware);

export default app;
