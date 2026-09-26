import { Router } from 'express';
import { requireAuth } from '../../core/middleware/auth.middleware';
import { requireAdmin } from '../../core/middleware/role.middleware';
import { SuccessResponse } from '../../core/http/result';

import { AdminController } from './admin.controller';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/dashboard', AdminController.getDashboardSummary);
router.get('/dashboard/summary', AdminController.getDashboardSummary);

// Users
router.get('/users', AdminController.listUsers);
router.get('/users/:id', AdminController.getUserDetails);
router.patch('/users/:id/status', AdminController.updateUserStatus);
router.delete('/users/:id', AdminController.softDeleteUser);

// Donors
router.get('/donors', AdminController.listDonors);
router.get('/donors/:id', AdminController.getDonorDetails);
router.patch('/donors/:id/status', AdminController.updateDonorStatus);
router.patch('/donors/:id/verify', AdminController.verifyDonor);
router.post('/donors/:id/verify', AdminController.verifyDonor);

// Blood Requests
router.get('/requests', AdminController.listRequests);
router.get('/blood-requests', AdminController.listRequests);
router.get('/requests/:id', AdminController.getRequestDetails);
router.get('/blood-requests/:id', AdminController.getRequestDetails);
router.get('/blood-requests/:id/matching-donors', AdminController.getMatchingDonors);
router.post('/blood-requests/:id/verify', AdminController.verifyBloodRequest);
router.post('/blood-requests/:id/fulfill', AdminController.fulfillRequestUnits);
router.patch('/requests/:id/status', AdminController.updateRequestStatus);
router.patch('/blood-requests/:id/status', AdminController.updateRequestStatus);
router.delete('/requests/:id', AdminController.softDeleteRequest);
router.delete('/blood-requests/:id', AdminController.softDeleteRequest);

// Emergency Requests
router.get('/emergency-requests', AdminController.listEmergencyRequests);
router.get('/emergency-requests/:id', AdminController.getEmergencyRequestDetails);
router.get('/emergency-requests/:id/responses', AdminController.getEmergencyResponses);
router.post('/emergency-requests/:id/approve', AdminController.approveEmergencyRequest);
router.post('/emergency-requests/:id/reject', AdminController.rejectEmergencyRequest);
router.post('/emergency-requests/:id/broadcast', AdminController.triggerBroadcast);
router.post('/emergency-requests/:id/close', AdminController.closeEmergencyRequest);
router.patch('/emergency-requests/:id', AdminController.reviewEmergencyRequest);

// Donations
router.get('/donations', AdminController.listDonations);
router.patch('/donations/:id/verify', AdminController.verifyDonation);
router.post('/donations/:id/verify', AdminController.verifyDonation);

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

import { AdminSettingsController } from './adminSettings.controller';

// Settings & Audit
router.get('/settings', AdminSettingsController.getSettings);
router.put('/settings', AdminSettingsController.updateSettings);
router.patch('/settings', AdminSettingsController.updateSettings);
router.get('/settings/:key', AdminSettingsController.getSettingByKey);
router.patch('/settings/:key', AdminSettingsController.updateSettingByKey);
router.get('/audit', AdminSettingsController.getAuditLogs);
router.get('/audit-events', AdminSettingsController.getAuditLogs);

export default router;
