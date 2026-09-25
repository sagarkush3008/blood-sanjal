import { apiClient } from './client';

export const DonorsAPI = {
  search: (params?: any) => apiClient.get('/donors/search', { params }),
  getProfile: (id: string) => apiClient.get(`/donors/${id}`),
};

export const ContactRequestsAPI = {
  create: (data: any) => apiClient.post('/contact-requests', data),
  list: (params?: any) => apiClient.get('/contact-requests', { params }),
  getById: (id: string) => apiClient.get(`/contact-requests/${id}`),
  accept: (id: string) => apiClient.patch(`/contact-requests/${id}/accept`),
  decline: (id: string) => apiClient.patch(`/contact-requests/${id}/decline`),
};
