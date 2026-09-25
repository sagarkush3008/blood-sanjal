import { apiClient } from './client';

export const AuthAPI = {
  login: (data: any) => apiClient.post('/auth/login', data),
  register: (data: any) => apiClient.post('/auth/register', data),
  logout: () => apiClient.post('/auth/logout'),
  refresh: () => apiClient.post('/auth/refresh'),
  forgotPassword: (data: any) => apiClient.post('/auth/forgot-password', data),
  resetPassword: (data: any) => apiClient.post('/auth/reset-password', data),
  verifyEmail: (data: any) => apiClient.post('/auth/verify-email', data),
  getCurrentUser: () => apiClient.get('/me'),
  updateProfile: (data: any) => apiClient.patch('/me', data),
  getPrivacySettings: () => apiClient.get('/me/privacy'),
  updatePrivacySettings: (data: any) => apiClient.patch('/me/privacy', data),
};
