import { Router } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';
import { authLimiter } from '../../core/middleware/rateLimit.middleware';

const router = Router();

// Apply auth rate limiter to entrypoint routes
router.post('/register', authLimiter, AuthController.register);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/login', authLimiter, AuthController.login);
router.post('/forgot-password', authLimiter, AuthController.forgotPassword);
router.post('/reset-password', authLimiter, AuthController.resetPassword);
router.post('/refresh', AuthController.refresh);
router.post('/logout', requireAuth, AuthController.logout);

export default router;
