import { Router } from 'express';
import { DonorController } from './donor.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';

const router = Router();

// Publicly readable safe profiles
router.get('/search', DonorController.search);

// Private profile management
router.get('/me/profile', requireAuth, DonorController.getMe);
router.post('/me/profile', requireAuth, DonorController.upsertMe);
router.post('/me/donations', requireAuth, DonorController.logDonation);

export default router;
