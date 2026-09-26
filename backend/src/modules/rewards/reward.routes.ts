import { Router } from 'express';
import { RewardController } from './reward.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';
import { requireRoles } from '../../core/middleware/role.middleware';

const router = Router();

// Public / User routes
router.get('/me', requireAuth, RewardController.getMyRewards);
router.get('/my', requireAuth, RewardController.getMyRewards);
router.get('/stats', requireAuth, RewardController.getStats);
router.get('/milestones', RewardController.getMilestones);
router.get('/profile/:profileId', requireAuth, RewardController.getUserRewards);

// Admin routes
router.get('/', requireAuth, requireRoles(['ADMIN', 'SUPER_ADMIN']), RewardController.getAll);
router.get('/config', requireAuth, requireRoles(['ADMIN', 'SUPER_ADMIN']), RewardController.getConfig);
router.post('/config', requireAuth, requireRoles(['ADMIN', 'SUPER_ADMIN']), RewardController.updateConfig);
router.patch('/config', requireAuth, requireRoles(['ADMIN', 'SUPER_ADMIN']), RewardController.updateConfig);
router.post('/issue', requireAuth, requireRoles(['ADMIN', 'SUPER_ADMIN']), RewardController.issueManual);

export default router;
