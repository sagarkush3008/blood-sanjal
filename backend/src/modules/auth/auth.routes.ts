import { Router } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/login', AuthController.login);
router.post('/refresh', requireAuth, AuthController.refresh);
router.post('/logout', requireAuth, AuthController.logout);

export default router;
