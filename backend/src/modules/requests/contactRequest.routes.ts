import { Router } from 'express';
import { ContactRequestController } from './contactRequest.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';
import { paymentLimiter } from '../../core/middleware/rateLimit.middleware';

const router = Router();

router.use(paymentLimiter); // using paymentLimiter (max 20 per 15 min) for contact requests as per risk

router.post('/', requireAuth, ContactRequestController.create);
router.post('/:id/accept', requireAuth, ContactRequestController.accept);
router.post('/:id/decline', requireAuth, ContactRequestController.decline);

export default router;
