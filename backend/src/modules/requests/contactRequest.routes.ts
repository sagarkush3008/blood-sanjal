import { Router } from 'express';
import { ContactRequestController } from './contactRequest.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';

const router = Router();

router.post('/', requireAuth, ContactRequestController.create);
router.post('/:id/accept', requireAuth, ContactRequestController.accept);
router.post('/:id/decline', requireAuth, ContactRequestController.decline);

export default router;
