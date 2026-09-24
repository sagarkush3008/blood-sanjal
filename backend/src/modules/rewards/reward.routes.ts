import { Router } from 'express';
import { RewardController } from './reward.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';
import { requireRoles } from '../../core/middleware/role.middleware';

const router = Router();

// Public / User routes
router.get('/me', requireAuth, RewardController.getMyRewards);
router.get('/profile/:profileId', requireAuth, RewardController.getUserRewards);

// Admin routes
router.get('/', requireAuth, requireRoles(['ADMIN']), RewardController.getAll);
router.get('/config', requireAuth, requireRoles(['ADMIN']), RewardController.getConfig);
router.post('/config', requireAuth, requireRoles(['ADMIN']), RewardController.updateConfig);

export default router;
