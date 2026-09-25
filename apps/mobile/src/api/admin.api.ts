import { apiClient } from './client';

export const AdminAPI = {
  getDashboardStats: () => apiClient.get('/admin/dashboard'),
  getUsers: (params?: any) => apiClient.get('/admin/users', { params }),
  updateUserStatus: (id: string, data: any) => apiClient.patch(`/admin/users/${id}/status`, data),
  getDonors: (params?: any) => apiClient.get('/admin/donors', { params }),
  getRequests: (params?: any) => apiClient.get('/admin/requests', { params }),
  reviewEmergencyRequest: (id: string, data: any) => apiClient.patch(`/admin/emergency-requests/${id}`, data),
  getSettings: () => apiClient.get('/admin/settings'),
  updateSettings: (data: any) => apiClient.patch('/admin/settings', data),
  getAuditLogs: (params?: any) => apiClient.get('/admin/audit', { params }),
};
