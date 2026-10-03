import { Router } from 'express';
import { UserController } from './user.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';

import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', requireAuth, UserController.getMe);
router.patch('/', requireAuth, UserController.updateMe);
router.get('/privacy', requireAuth, UserController.getPrivacy);
router.patch('/privacy', requireAuth, UserController.updatePrivacy);
router.put('/avatar', requireAuth, upload.single('avatar'), UserController.uploadAvatar);

export default router;
