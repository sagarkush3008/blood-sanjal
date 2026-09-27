import { apiClient } from './client';

export const LegalAPI = {
  getTerms: () => apiClient.get('/legal/terms'),
  getPrivacyPolicy: () => apiClient.get('/legal/privacy'),
  getDisclaimer: () => apiClient.get('/legal/disclaimer'),
};
