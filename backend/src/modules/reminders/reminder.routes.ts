import { Router } from 'express';
import { ReminderController } from './reminder.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';
import { requireRoles } from '../../core/middleware/role.middleware';

const router = Router();

router.get('/config', requireAuth, requireRoles(['ADMIN']), ReminderController.getConfig);
router.post('/config', requireAuth, requireRoles(['ADMIN']), ReminderController.updateConfig);
router.post('/trigger', requireAuth, requireRoles(['ADMIN']), ReminderController.triggerJobs);

export default router;
