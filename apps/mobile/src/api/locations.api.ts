import { apiClient } from './client';

export interface LocationItem {
  _id: string;
  name: string;
  code: string;
  type: 'PROVINCE' | 'DISTRICT' | 'MUNICIPALITY';
  parentId?: string;
}

export const LocationsAPI = {
  getHierarchy: (parentId?: string) =>
    apiClient.get('/locations', { params: { parentId } }),
  getBloodBanks: () => apiClient.get('/locations/banks'),
  searchProximity: (lon: number, lat: number, distance = 5000) =>
    apiClient.get('/locations/donors/search', { params: { lon, lat, distance } }),
};
