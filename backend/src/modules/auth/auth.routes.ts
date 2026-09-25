import { Router } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';
import { authLimiter } from '../../core/middleware/rateLimit.middleware';

const router = Router();

router.use(authLimiter);

router.post('/register', AuthController.register);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/login', AuthController.login);
router.post('/refresh', requireAuth, AuthController.refresh);
router.post('/logout', requireAuth, AuthController.logout);

export default router;
