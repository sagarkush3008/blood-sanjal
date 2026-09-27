import { apiClient } from './client';

export const CampaignsAPI = {
  list: (params?: any) => apiClient.get('/campaigns', { params }),
  listMy: () => apiClient.get('/campaigns/my'),
  getById: (id: string) => apiClient.get(`/campaigns/${id}`),
  create: (data: any) => apiClient.post('/campaigns', data),
  update: (id: string, data: any) => apiClient.patch(`/campaigns/${id}`, data),
  updateStatus: (id: string, status: string) => apiClient.patch(`/campaigns/${id}/status`, { status }),
  participate: (id: string) => apiClient.post(`/campaigns/${id}/participate`),
  withdraw: (id: string) => apiClient.post(`/campaigns/${id}/withdraw`),
  setReminder: (id: string, data?: any) => apiClient.post(`/campaigns/${id}/reminder`, data),
  notifyUsers: (id: string, message: string) => apiClient.post(`/campaigns/${id}/notify`, { message }),
  delete: (id: string) => apiClient.delete(`/campaigns/${id}`),
  getParticipants: (id: string) => apiClient.get(`/campaigns/${id}/participants`),
  updateParticipant: (id: string, participantId: string, data: any) =>
    apiClient.patch(`/campaigns/${id}/participants/${participantId}`, data),
};
