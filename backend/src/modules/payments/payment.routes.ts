import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { requireAuth, requireRole } from '../../core/middleware/auth.middleware';

const router = Router();

router.post('/search-fee/initiate', requireAuth, PaymentController.initiateSearchFee);
router.post('/webhook', PaymentController.webhook);
router.get('/history', requireAuth, PaymentController.getHistory);
router.get('/admin/report', requireAuth, requireRole(['SUPER_ADMIN']), PaymentController.getAdminReport);

export default router;
