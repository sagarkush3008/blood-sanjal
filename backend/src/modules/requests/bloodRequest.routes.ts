import { Router } from 'express';
import { BloodRequestController } from './bloodRequest.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';
import { requireAdmin } from '../../core/middleware/role.middleware';
import { emergencyLimiter } from '../../core/middleware/rateLimit.middleware';

const router = Router();

// User routes
router.post('/', requireAuth, BloodRequestController.create);
router.patch('/:id', requireAuth, BloodRequestController.update);
router.post('/:id/cancel', requireAuth, BloodRequestController.cancel);

// Fulfillment
router.post('/:id/fulfill', requireAuth, BloodRequestController.fulfill);

// Admin routes
router.post('/:id/verify', requireAuth, requireAdmin, BloodRequestController.verify);
router.post('/:id/broadcast', requireAuth, requireAdmin, emergencyLimiter, BloodRequestController.broadcast);

export default router;
