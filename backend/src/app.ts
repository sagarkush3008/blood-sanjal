import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.config';
import { globalLimiter } from './core/middleware/rateLimit.middleware';
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
import { SuccessResponse, ErrorResponse } from './core/http/result';
import { logger } from './config/logger.config';
import swaggerUi from 'swagger-ui-express';
import * as path from 'path';
import * as fs from 'fs';

const app = express();

// Load OpenAPI spec
let swaggerDocument: any;
try {
  const swaggerPath = path.join(__dirname, '../docs/openapi.json');
  if (fs.existsSync(swaggerPath)) {
    swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
  } else {
    // try one more level up for dist
    const distPath = path.join(__dirname, '../../docs/openapi.json');
    if (fs.existsSync(distPath)) {
      swaggerDocument = JSON.parse(fs.readFileSync(distPath, 'utf8'));
    }
  }
} catch (error) {
  logger.warn('Failed to load swagger docs');
}

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

// NoSQL Injection Protection
app.use((req, res, next) => {
  const sanitize = (obj: any) => {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      for (const key in obj) {
        if (key.startsWith('$')) {
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      }
    }
  };
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
});

// Rate Limiting
app.use(globalLimiter);

import mongoose from 'mongoose';

// Health and Readiness
app.get('/health', (req, res) => {
  res.status(200).json(SuccessResponse({ status: 'UP' }, req.id));
});
app.get('/ready', (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1; // 1 = connected
  if (isDbReady) {
    res.status(200).json(SuccessResponse({ status: 'READY' }, req.id));
  } else {
    res.status(503).json(ErrorResponse('SERVICE_UNAVAILABLE', 'Database not ready', [], req.id));
  }
});

// Swagger Documentation Route (Disabled in production)
if (swaggerDocument && env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

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
