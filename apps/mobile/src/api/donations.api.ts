import { apiClient } from './client';

export const DonationsAPI = {
  create: (data: any) => apiClient.post('/donations', data),
  list: (params?: any) => apiClient.get('/donations', { params }),
  getById: (id: string) => apiClient.get(`/donations/${id}`),
  updateStatus: (id: string, data: any) => apiClient.patch(`/donations/${id}`, data),
};
