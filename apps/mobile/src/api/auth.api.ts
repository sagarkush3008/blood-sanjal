import { apiClient } from './client';

export interface LoginPayload {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  bloodGroup?: string;
}

export interface VerifyOtpPayload {
  userId: string;
  code: string;
  purpose: 'REGISTRATION' | 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
}

export interface ForgotPasswordPayload {
  email?: string;
  phone?: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  userId?: string;
}

export const AuthAPI = {
  login: (data: LoginPayload) => apiClient.post('/auth/login', data),
  register: (data: RegisterPayload) => apiClient.post('/auth/register', data),
  logout: () => apiClient.post('/auth/logout'),
  refresh: (refreshToken?: string) => apiClient.post('/auth/refresh', { refreshToken }),
  forgotPassword: (data: ForgotPasswordPayload) => apiClient.post('/auth/forgot-password', data),
  resetPassword: (data: ResetPasswordPayload) => apiClient.post('/auth/reset-password', data),
  verifyEmail: (data: VerifyOtpPayload) => apiClient.post('/auth/verify-email', data),
  getCurrentUser: () => apiClient.get('/me'),
  updateProfile: (data: any) => apiClient.patch('/me', data),
  getPrivacySettings: () => apiClient.get('/me/privacy'),
  updatePrivacySettings: (data: any) => apiClient.patch('/me/privacy', data),
};
