import { apiClient } from './client';

export const CampaignsAPI = {
  list: (params?: any) => apiClient.get('/campaigns', { params }),
  getById: (id: string) => apiClient.get(`/campaigns/${id}`),
  create: (data: any) => apiClient.post('/campaigns', data),
  update: (id: string, data: any) => apiClient.patch(`/campaigns/${id}`, data),
  participate: (id: string) => apiClient.post(`/campaigns/${id}/participate`),
  setReminder: (id: string, data: any) => apiClient.post(`/campaigns/${id}/reminder`, data),
};
