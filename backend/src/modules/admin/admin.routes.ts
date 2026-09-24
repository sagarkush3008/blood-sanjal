import { Router } from 'express';
import { requireAuth } from '../../core/middleware/auth.middleware';
import { requireAdmin } from '../../core/middleware/role.middleware';
import { SuccessResponse } from '../../core/http/result';

const router = Router();

router.get('/dashboard', requireAuth, requireAdmin, (req, res) => {
  res.status(200).json(SuccessResponse({ message: 'Welcome Admin' }, req.id));
});

export default router;
