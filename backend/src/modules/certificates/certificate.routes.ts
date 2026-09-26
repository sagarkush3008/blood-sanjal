import { Router } from 'express';
import { CertificateController } from './certificate.controller';
import { requireAuth } from '../../core/middleware/auth.middleware';
import { requireRoles } from '../../core/middleware/role.middleware';

const router = Router();

// Public routes
router.get('/verify/:code', CertificateController.verifyPublic);
router.get('/verify', CertificateController.verifyPublic);

// User routes (must precede /:id)
router.get('/me', requireAuth, CertificateController.getMyCertificates);
router.get('/my', requireAuth, CertificateController.getMyCertificates);
router.get('/:id', requireAuth, CertificateController.getById);

// Admin routes
router.post('/', requireAuth, requireRoles(['ADMIN', 'SUPER_ADMIN']), CertificateController.issue);
router.patch('/:id/revoke', requireAuth, requireRoles(['ADMIN', 'SUPER_ADMIN']), CertificateController.revoke);
router.get('/', requireAuth, requireRoles(['ADMIN', 'SUPER_ADMIN']), CertificateController.getAll);

export default router;
