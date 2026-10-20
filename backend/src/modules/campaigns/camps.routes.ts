import { Router } from 'express';
import { getUpcomingCamps } from './camps.controller';

const router = Router();

// GET /api/camps
router.get('/', getUpcomingCamps);

export default router;
