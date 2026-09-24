import { Router } from 'express';
import { CertificateController } from './certificate.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';
import { requireRoles } from '../../core/middleware/role.middleware';

const router = Router();

// Public routes
router.get('/verify', CertificateController.verifyPublic);

// User routes
router.get('/me', requireAuth, CertificateController.getMyCertificates);

// Admin routes
router.post('/', requireAuth, requireRoles(['ADMIN']), CertificateController.issue);
router.patch('/:id/revoke', requireAuth, requireRoles(['ADMIN']), CertificateController.revoke);
router.get('/', requireAuth, requireRoles(['ADMIN']), CertificateController.getAll);

export default router;
