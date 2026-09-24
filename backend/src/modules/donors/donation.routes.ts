import { Router } from 'express';
import { DonationController } from './donation.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';
import { requireRoles } from '../../core/middleware/role.middleware';

const router = Router();

router.post('/me', requireAuth, DonationController.submit);

router.get('/', requireAuth, requireRoles(['ADMIN', 'HOSPITAL', 'BLOOD_BANK', 'NGO']), DonationController.getHistory);
router.get('/:id', requireAuth, requireRoles(['ADMIN', 'HOSPITAL', 'BLOOD_BANK', 'NGO']), DonationController.getDetail);
router.post('/:id/verify', requireAuth, requireRoles(['ADMIN', 'HOSPITAL', 'BLOOD_BANK', 'NGO']), DonationController.verify);

export default router;
