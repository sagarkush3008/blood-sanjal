import { apiClient } from './client';

export const BloodRequestsAPI = {
  create: (data: any) => apiClient.post('/requests', data),
  list: (params?: any) => apiClient.get('/requests', { params }),
  getById: (id: string) => apiClient.get(`/requests/${id}`),
  update: (id: string, data: any) => apiClient.patch(`/requests/${id}`, data),
  cancel: (id: string) => apiClient.post(`/requests/${id}/cancel`),
  fulfill: (id: string, units: number = 1) => apiClient.post(`/requests/${id}/fulfill`, { units }),
};

export const EmergencyRequestsAPI = {
  create: (data: any) => apiClient.post('/requests/emergency', data),
  list: (params?: any) => apiClient.get('/requests/emergency', { params }),
  getById: (id: string) => apiClient.get(`/requests/emergency/${id}`),
  adminReview: (id: string, data: any) => apiClient.patch(`/requests/emergency/${id}/review`, data),
};
