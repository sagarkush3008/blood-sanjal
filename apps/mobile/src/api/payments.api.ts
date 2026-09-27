import { apiClient } from './client';

export const PaymentsAPI = {
  initiate: (data: any) => apiClient.post('/payments/initiate', data),
  initiateSearchFee: (data?: any) => apiClient.post('/payments/search-fee/initiate', data),
  getHistory: () => apiClient.get('/payments/history'),
  getById: (id: string) => apiClient.get(`/payments/${id}`),
  webhookCallback: (data: any) => apiClient.post('/payments/webhook', data),
  getAdminSummary: () => apiClient.get('/payments/admin/summary'),
  getAdminReport: (params?: any) => apiClient.get('/payments/admin/report', { params }),
  confirmMockSearchFee: async () => {
    const initRes = await apiClient.post('/payments/search-fee/initiate');
    const gatewayTxId =
      initRes.data?.data?.gatewayTransactionId ||
      initRes.data?.gatewayTransactionId ||
      initRes.data?.data?.transactionId;
    if (gatewayTxId) {
      await apiClient.post('/payments/webhook', { gatewayTxId });
    }
    return initRes.data;
  },
};
