import { Router } from 'express';
import { DonationController } from './donation.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';
import { requireRoles } from '../../core/middleware/role.middleware';

import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = Router();

router.post('/record', requireAuth, upload.any(), DonationController.recordDonation);
router.post('/', requireAuth, upload.any(), DonationController.recordDonation);
router.post('/me', requireAuth, upload.any(), DonationController.recordDonation);
router.post('/log', requireAuth, DonationController.logDonationWithAI);
router.post('/assess', requireAuth, DonationController.assessEligibility);
router.post('/reset-cooldown', requireAuth, DonationController.resetCooldown);

router.get('/', requireAuth, DonationController.getHistory);
router.get('/me', requireAuth, DonationController.getHistory);
router.get('/:id', requireAuth, DonationController.getDetail);
router.post('/:id/verify', requireAuth, requireRoles(['ADMIN', 'SUPER_ADMIN', 'HOSPITAL', 'BLOOD_BANK', 'NGO']), DonationController.verify);
router.patch('/:id', requireAuth, requireRoles(['ADMIN', 'SUPER_ADMIN', 'HOSPITAL', 'BLOOD_BANK', 'NGO']), DonationController.verify);

export default router;
