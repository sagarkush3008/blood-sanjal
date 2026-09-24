import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';

const router = Router();

router.post('/search-fee/initiate', requireAuth, PaymentController.initiateSearchFee);
router.post('/verify', requireAuth, PaymentController.verify);

export default router;
