import { Router } from 'express';
import { UserController } from './user.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';

const router = Router();

router.get('/me', requireAuth, UserController.getMe);
router.patch('/me', requireAuth, UserController.updateMe);

export default router;
