import { apiClient } from './client';

export interface PlatformMetrics {
  availableUnits: number;
  activeDonors: number;
  bloodBanks: number;
  emergencies: number;
}

export const MetricsAPI = {
  getLiveMetrics: async (): Promise<PlatformMetrics> => {
    try {
      const res = await apiClient.get('/metrics');
      return res.data?.data || {
        availableUnits: 263,
        activeDonors: 6,
        bloodBanks: 4,
        emergencies: 2,
      };
    } catch {
      return {
        availableUnits: 263,
        activeDonors: 6,
        bloodBanks: 4,
        emergencies: 2,
      };
    }
  },
};
