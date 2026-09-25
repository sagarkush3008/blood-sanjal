import { apiClient } from './client';

export const PaymentsAPI = {
  initiateSearchFee: (data: any) => apiClient.post('/payments/search-fee/initiate', data),
  getHistory: () => apiClient.get('/payments/history'),
  webhookCallback: (data: any) => apiClient.post('/payments/webhook', data),
};
