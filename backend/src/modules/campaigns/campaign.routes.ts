import { Router } from 'express';
import { CampaignController } from './campaign.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';
import { requireRoles } from '../../core/middleware/role.middleware';

const router = Router();

// Public routes
router.get('/', CampaignController.list);
router.get('/:id', CampaignController.get);

// User routes
router.post('/:id/register', requireAuth, CampaignController.register);

// Admin / Organizer routes
const adminRoles = requireRoles(['ADMIN', 'HOSPITAL', 'BLOOD_BANK', 'NGO', 'CAMPAIGN_ORGANIZER']);
router.post('/', requireAuth, adminRoles, CampaignController.create);
router.patch('/:id/status', requireAuth, adminRoles, CampaignController.updateStatus);
router.post('/:id/notify', requireAuth, adminRoles, CampaignController.notifyUsers);
router.delete('/:id', requireAuth, adminRoles, CampaignController.delete);

export default router;
