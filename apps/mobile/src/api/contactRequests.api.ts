import { apiClient } from './client';

export interface CreateContactRequestPayload {
  donorId: string;
  message?: string;
}

export const ContactRequestsAPI = {
  create: (data: CreateContactRequestPayload) => apiClient.post('/contact-requests', data),
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get('/contact-requests', { params }),
  getById: (id: string) => apiClient.get(`/contact-requests/${id}`),
  accept: (id: string) => apiClient.post(`/contact-requests/${id}/accept`),
  decline: (id: string) => apiClient.post(`/contact-requests/${id}/decline`),
  cancel: (id: string) => apiClient.post(`/contact-requests/${id}/cancel`),
};
