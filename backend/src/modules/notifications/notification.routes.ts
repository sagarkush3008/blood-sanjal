import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', NotificationController.list);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/read-all', NotificationController.markAllAsRead);
router.patch('/:id/read', NotificationController.markAsRead);

export default router;
