import { Router } from 'express';
import { requireAuth } from '../../core/middleware/auth.middleware';
import { requireAdmin } from '../../core/middleware/role.middleware';
import { SuccessResponse } from '../../core/http/result';

import { AdminController } from './admin.controller';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/dashboard', (req, res) => {
  res.status(200).json(SuccessResponse({ message: 'Welcome Admin' }, req.id));
});

// Users
router.get('/users', AdminController.listUsers);
router.get('/users/:id', AdminController.getUserDetails);
router.patch('/users/:id/status', AdminController.updateUserStatus);
router.delete('/users/:id', AdminController.softDeleteUser);

// Donors
router.get('/donors', AdminController.listDonors);
router.patch('/donors/:id/status', AdminController.updateDonorStatus);

// Requests
router.get('/requests', AdminController.listRequests);
router.patch('/requests/:id/status', AdminController.updateRequestStatus);
router.delete('/requests/:id', AdminController.softDeleteRequest);

// Donations
router.get('/donations', AdminController.listDonations);
router.patch('/donations/:id/verify', AdminController.verifyDonation);

import { AdminOpsController } from './adminOps.controller';

// Campaigns
router.post('/campaigns', AdminOpsController.createCampaign);
router.put('/campaigns/:id', AdminOpsController.updateCampaign);
router.patch('/campaigns/:id/status', AdminOpsController.updateCampaignStatus);

// Notifications
router.post('/notifications', AdminOpsController.createBroadcast);
router.post('/notifications/:id/cancel', AdminOpsController.cancelBroadcast);
router.post('/notifications/:id/process', AdminOpsController.processBroadcastSync);

// Rewards
router.post('/rewards', AdminOpsController.issueReward);

import { AdminReportsController } from './adminReports.controller';

// Reports
router.get('/reports/kpis', AdminReportsController.getDashboardKPIs);
router.get('/reports/aggregations/:type', AdminReportsController.getAggregations);
router.post('/reports/export', AdminReportsController.requestExport);
router.post('/reports/export/:jobId/process', AdminReportsController.processExportSync);

export default router;
