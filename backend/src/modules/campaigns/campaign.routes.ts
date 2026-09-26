import { Router } from 'express';
import { CampaignController } from './campaign.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';
import { requireRoles } from '../../core/middleware/role.middleware';

const router = Router();

// User / My routes (must precede /:id)
router.get('/me', requireAuth, CampaignController.listMy);
router.get('/my', requireAuth, CampaignController.listMy);

// Public routes
router.get('/', CampaignController.list);
router.get('/:id', CampaignController.get);

// User routes
router.post('/:id/register', requireAuth, CampaignController.register);
router.post('/:id/participate', requireAuth, CampaignController.register);
router.post('/:id/withdraw', requireAuth, CampaignController.withdraw);
router.post('/:id/reminder', requireAuth, CampaignController.setReminder);

// Admin / Organizer routes
const adminRoles = requireRoles(['ADMIN', 'SUPER_ADMIN', 'HOSPITAL', 'BLOOD_BANK', 'NGO', 'CAMPAIGN_ORGANIZER']);
router.post('/', requireAuth, adminRoles, CampaignController.create);
router.patch('/:id', requireAuth, adminRoles, CampaignController.update);
router.patch('/:id/status', requireAuth, adminRoles, CampaignController.updateStatus);
router.post('/:id/notify', requireAuth, adminRoles, CampaignController.notifyUsers);
router.delete('/:id', requireAuth, adminRoles, CampaignController.delete);
router.get('/:id/participants', requireAuth, adminRoles, CampaignController.getParticipants);
router.patch('/:id/participants/:participantId', requireAuth, adminRoles, CampaignController.updateParticipant);

export default router;
