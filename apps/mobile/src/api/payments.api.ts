import { apiClient } from './client';

export const PaymentsAPI = {
  createPaymentIntent: (data: any) => apiClient.post('/payments/intent', data),
  getPaymentStatus: (id: string) => apiClient.get(`/payments/${id}`),
  webhookCallback: (provider: string, data: any) => apiClient.post(`/payments/webhook/${provider}`, data),
};
