import { apiClient } from './client';

export interface DonorSearchParams {
  bloodGroup?: string;
  provinceId?: string;
  districtId?: string;
  cityId?: string;
  lon?: number;
  lat?: number;
  distance?: number;
  page?: number;
  limit?: number;
}

export interface UpdateAvailabilityPayload {
  status: 'ACTIVE' | 'INACTIVE';
  durationHours?: number;
  durationDays?: number;
  reason?: string | null;
}

export const DonorsAPI = {
  search: (params?: DonorSearchParams) => apiClient.get('/donors/search', { params }),
  getProfile: (id: string) => apiClient.get(`/donors/${id}`),
  getMyProfile: () => apiClient.get('/donors/me/profile'),
  upsertMyProfile: (data: any) => apiClient.post('/donors/me/profile', data),
  getMyStatus: () => apiClient.get('/donors/me/status'),
  updateMyStatus: (status: 'ACTIVE' | 'INACTIVE') => apiClient.patch('/donors/me/status', { status }),
  updateMyAvailability: (data: UpdateAvailabilityPayload) =>
    apiClient.patch('/donors/me/availability', {
      ...data,
      reason: data.reason ?? null,
    }),
};
