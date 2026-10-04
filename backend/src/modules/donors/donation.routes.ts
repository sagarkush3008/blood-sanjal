import { Router } from 'express';
import { DonationController } from './donation.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';
import { requireRoles } from '../../core/middleware/role.middleware';

const router = Router();

router.post('/', requireAuth, DonationController.submit);
router.post('/me', requireAuth, DonationController.submit);
router.post('/log-and-analyze', requireAuth, DonationController.logAndAnalyzeDonation);

router.get('/', requireAuth, DonationController.getHistory);
router.get('/me', requireAuth, DonationController.getHistory);
router.get('/:id', requireAuth, DonationController.getDetail);
router.post('/:id/verify', requireAuth, requireRoles(['ADMIN', 'SUPER_ADMIN', 'HOSPITAL', 'BLOOD_BANK', 'NGO']), DonationController.verify);
router.patch('/:id', requireAuth, requireRoles(['ADMIN', 'SUPER_ADMIN', 'HOSPITAL', 'BLOOD_BANK', 'NGO']), DonationController.verify);

export default router;
