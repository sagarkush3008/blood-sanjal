import { apiClient } from './client';

export const AdminAPI = {
  // Dashboard & Analytics
  getDashboardStats: () => apiClient.get('/admin/dashboard/summary'),
  getDashboardSummary: () => apiClient.get('/admin/dashboard/summary'),
  getKPIs: () => apiClient.get('/admin/reports/kpis'),

  // Users & Donors
  getUsers: (params?: any) => apiClient.get('/admin/users', { params }),
  getUserDetails: (id: string) => apiClient.get(`/admin/users/${id}`),
  updateUserStatus: (id: string, data: { status: string }) => apiClient.patch(`/admin/users/${id}/status`, data),
  deleteUser: (id: string) => apiClient.delete(`/admin/users/${id}`),
  
  getDonors: (params?: any) => apiClient.get('/admin/donors', { params }),
  getDonorDetails: (id: string) => apiClient.get(`/admin/donors/${id}`),
  updateDonorStatus: (id: string, data: { donorStatus: string; isVerified?: boolean }) => apiClient.patch(`/admin/donors/${id}/status`, data),
  verifyDonor: (id: string, data: { isVerified: boolean }) => apiClient.post(`/admin/donors/${id}/verify`, data),

  // Blood Requests
  getBloodRequests: (params?: any) => apiClient.get('/admin/blood-requests', { params }),
  getRequests: (params?: any) => apiClient.get('/admin/blood-requests', { params }),
  getBloodRequestDetails: (id: string) => apiClient.get(`/admin/blood-requests/${id}`),
  verifyBloodRequest: (id: string, data: { activate?: boolean }) => apiClient.post(`/admin/blood-requests/${id}/verify`, data),
  fulfillBloodRequest: (id: string, data: { unitsFulfilled: number }) => apiClient.post(`/admin/blood-requests/${id}/fulfill`, data),
  updateBloodRequestStatus: (id: string, data: { status: string; urgency?: string }) => apiClient.patch(`/admin/blood-requests/${id}/status`, data),
  deleteBloodRequest: (id: string) => apiClient.delete(`/admin/blood-requests/${id}`),
  getMatchingDonors: (id: string) => apiClient.get(`/admin/blood-requests/${id}/matching-donors`),

  // Emergency Clinical Review & Broadcasting
  getEmergencyRequests: (params?: any) => apiClient.get('/admin/emergency-requests', { params }),
  getEmergencyDetails: (id: string) => apiClient.get(`/admin/emergency-requests/${id}`),
  getEmergencyResponses: (id: string) => apiClient.get(`/admin/emergency-requests/${id}/responses`),
  approveEmergency: (id: string) => apiClient.post(`/admin/emergency-requests/${id}/approve`, {}),
  rejectEmergency: (id: string, reason?: string) => apiClient.post(`/admin/emergency-requests/${id}/reject`, { reason }),
  broadcastEmergency: (id: string) => apiClient.post(`/admin/emergency-requests/${id}/broadcast`, {}),
  closeEmergency: (id: string, reason?: string) => apiClient.post(`/admin/emergency-requests/${id}/close`, { reason }),
  reviewEmergencyRequest: (id: string, data: any) => apiClient.patch(`/admin/emergency-requests/${id}`, data),

  // Donation Verifications & Certificates
  getDonations: (params?: any) => apiClient.get('/admin/donations', { params }),
  getDonationDetails: (id: string) => apiClient.get(`/admin/donations/${id}`),
  verifyDonation: (id: string, data: { status: 'VERIFIED' | 'REJECTED'; reason?: string }) => apiClient.post(`/admin/donations/${id}/verify`, data),
  issueDonationCertificate: (id: string) => apiClient.post(`/admin/donations/${id}/certificate`, {}),

  // Campaigns & Drives
  getCampaigns: (params?: any) => apiClient.get('/admin/campaigns', { params }),
  getCampaignDetails: (id: string) => apiClient.get(`/admin/campaigns/${id}`),
  createCampaign: (data: any) => apiClient.post('/admin/campaigns', data),
  updateCampaign: (id: string, data: any) => apiClient.patch(`/admin/campaigns/${id}`, data),
  updateCampaignStatus: (id: string, data: { status: string }) => apiClient.patch(`/admin/campaigns/${id}/status`, data),
  deleteCampaign: (id: string) => apiClient.delete(`/admin/campaigns/${id}`),
  getCampaignParticipants: (id: string) => apiClient.get(`/admin/campaigns/${id}/participants`),
  notifyCampaignAudience: (id: string, data: any) => apiClient.post(`/admin/campaigns/${id}/notify`, data),

  // Broadcast Notifications
  getBroadcasts: (params?: any) => apiClient.get('/admin/notifications', { params }),
  createBroadcast: (data: any) => apiClient.post('/admin/notifications', data),
  scheduleBroadcast: (data: any) => apiClient.post('/admin/notifications/schedule', data),
  cancelBroadcast: (id: string) => apiClient.post(`/admin/notifications/${id}/cancel`, {}),

  // Financials & Payments
  getPayments: (params?: any) => apiClient.get('/admin/payments', { params }),
  getPaymentSummary: () => apiClient.get('/admin/payments/summary'),
  getPaymentById: (id: string) => apiClient.get(`/admin/payments/${id}`),
  refundPayment: (id: string, reason?: string) => apiClient.post(`/admin/payments/${id}/refund`, { reason }),

  // System Settings, Reminders & Policies
  getSettings: () => apiClient.get('/admin/settings'),
  updateSettings: (data: any) => apiClient.patch('/admin/settings', data),
  getSettingByKey: (key: string) => apiClient.get(`/admin/settings/${key}`),
  updateSettingByKey: (key: string, value: any) => apiClient.patch(`/admin/settings/${key}`, { value }),
  getReminderConfig: () => apiClient.get('/admin/reminders/config'),
  updateReminderConfig: (data: any) => apiClient.patch('/admin/reminders/config', data),
  triggerReminders: (targetDate?: string) => apiClient.post('/admin/reminders/trigger', { targetDate }),

  // Security Audit & Reports
  getAuditLogs: (params?: any) => apiClient.get('/admin/audit-events', { params }),
  getReports: (type: string, params?: any) => apiClient.get(`/admin/reports/${type}`, { params }),
  exportReport: (data: any) => apiClient.post('/admin/reports/export', data),
};
