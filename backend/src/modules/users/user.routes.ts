import { Router } from 'express';
import { UserController } from './user.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';

const router = Router();

router.get('/', requireAuth, UserController.getMe);
router.patch('/', requireAuth, UserController.updateMe);

export default router;
