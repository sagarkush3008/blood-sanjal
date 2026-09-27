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

export const DonorsAPI = {
  search: (params?: DonorSearchParams) => apiClient.get('/donors/search', { params }),
  getProfile: (id: string) => apiClient.get(`/donors/${id}`),
  getMyProfile: () => apiClient.get('/donors/me/profile'),
  upsertMyProfile: (data: any) => apiClient.post('/donors/me/profile', data),
};
