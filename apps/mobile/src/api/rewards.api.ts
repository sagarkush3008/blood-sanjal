import { apiClient } from './client';

export const RewardsAPI = {
  getMyRewards: () => apiClient.get('/rewards/me'),
};

export const CertificatesAPI = {
  getMyCertificates: () => apiClient.get('/certificates/me'),
  getById: (id: string) => apiClient.get(`/certificates/${id}`),
  verify: (code: string) => apiClient.get(`/certificates/verify/${code}`),
};
