import { Router } from 'express';
import { LocationController } from './location.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';
import { requireAdmin } from '../../core/middleware/role.middleware';

const router = Router();

router.get('/', LocationController.getHierarchy);
router.get('/donors/search', LocationController.searchDonors);

router.post('/', requireAuth, requireAdmin, LocationController.createLocation);

export default router;
