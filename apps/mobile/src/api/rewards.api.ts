import { apiClient } from './client';

export const RewardsAPI = {
  getMyRewards: () => apiClient.get('/rewards/me'),
  getStats: () => apiClient.get('/rewards/stats'),
  getMilestones: () => apiClient.get('/rewards/milestones'),
  getUserRewards: (profileId: string) => apiClient.get(`/rewards/profile/${profileId}`),
};

export const CertificatesAPI = {
  getMyCertificates: () => apiClient.get('/certificates/me'),
  getById: (id: string) => apiClient.get(`/certificates/${id}`),
  verify: (code: string) => apiClient.get(`/certificates/verify/${code}`),
  getAll: (params?: any) => apiClient.get('/certificates', { params }),
  issue: (data: any) => apiClient.post('/certificates', data),
  revoke: (id: string, reason?: string) => apiClient.patch(`/certificates/${id}/revoke`, { reason }),
};
