import { apiClient } from './client';

export interface PlatformMetrics {
  availableUnits: number;
  availableUnitsByGroup?: Record<string, number>;
  activeDonors: number;
  bloodBanks: number;
  emergencies: number;
}

export const MetricsAPI = {
  getLiveMetrics: async (): Promise<PlatformMetrics> => {
    const defaultData = {
      availableUnits: 263,
      availableUnitsByGroup: {
        'A+': 45,
        'A-': 12,
        'B+': 58,
        'B-': 14,
        'O+': 89,
        'O-': 22,
        'AB+': 18,
        'AB-': 5,
      },
      activeDonors: 6,
      bloodBanks: 4,
      emergencies: 2,
    };

    try {
      const res = await apiClient.get('/metrics');
      if (res.data?.data) {
         return { ...defaultData, ...res.data.data };
      }
      return defaultData;
    } catch {
      return defaultData;
    }
  },
};

