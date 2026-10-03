import { Router } from 'express';
import { ActiveStatusController } from './activeStatus.controller';
import { requireAuth, requireRole } from '../../core/middleware/auth.middleware';

const activeStatusRouter = Router();

// Health check and summary (public or admin depending on requirements, assuming public for now)
activeStatusRouter.get('/health', ActiveStatusController.getSummary);
activeStatusRouter.get('/summary', ActiveStatusController.getSummary);

// Server-Sent Events (SSE) real-time stream
activeStatusRouter.get('/stream', ActiveStatusController.sseStream);

// Donors active status
activeStatusRouter.get('/donors', ActiveStatusController.getAllDonors);
activeStatusRouter.get('/donors/:userId', ActiveStatusController.getDonor);

// Protect these routes with requireAuth
activeStatusRouter.put('/donors/:userId/status', requireAuth, ActiveStatusController.updateDonorStatus);
activeStatusRouter.post('/donors/:userId/status', requireAuth, ActiveStatusController.updateDonorStatus);

// Heartbeat ping from donor client
activeStatusRouter.post('/heartbeat', requireAuth, ActiveStatusController.heartbeat);

// Active blood requests seeking donors
activeStatusRouter.get('/requests', ActiveStatusController.getAllRequests);
activeStatusRouter.post('/requests', requireAuth, ActiveStatusController.registerNewRequest);
activeStatusRouter.put('/requests/:id/status', requireAuth, ActiveStatusController.updateRequestStatus);

// Audit history (Admin only)
activeStatusRouter.get('/audit-history', requireAuth, requireRole(['ADMIN', 'SUPER_ADMIN']), ActiveStatusController.getAuditLogs);

export default activeStatusRouter;

