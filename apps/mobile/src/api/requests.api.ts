import { apiClient } from './client';

export const BloodRequestsAPI = {
  create: (data: any) => apiClient.post('/blood-requests', data),
  list: (params?: any) => apiClient.get('/blood-requests', { params }),
  getById: (id: string) => apiClient.get(`/blood-requests/${id}`),
  update: (id: string, data: any) => apiClient.patch(`/blood-requests/${id}`, data),
};

export const EmergencyRequestsAPI = {
  create: (data: any) => apiClient.post('/emergency-requests', data),
  list: (params?: any) => apiClient.get('/emergency-requests', { params }),
  getById: (id: string) => apiClient.get(`/emergency-requests/${id}`),
  adminReview: (id: string, data: any) => apiClient.patch(`/emergency-requests/${id}/review`, data), // Example admin review endpoint
};
