import { apiClient } from './client';

export const ActiveStatusAPI = {
  checkHealth: async () => {
    const res = await apiClient.get('/../active-status/health');
    return res.data?.data || res.data;
  },

  getSummary: async () => {
    const res = await apiClient.get('/../active-status/summary');
    return res.data?.data || res.data;
  },

  getDonors: async (filters?: any) => {
    const res = await apiClient.get('/../active-status/donors', { params: filters });
    return res.data?.data || res.data;
  },

  getDonorStatus: async (userId: string) => {
    const res = await apiClient.get(`/../active-status/donors/${encodeURIComponent(userId)}`);
    return res.data?.data || res.data;
  },

  updateDonorStatus: async (userId: string, payload: any) => {
    const res = await apiClient.put(`/../active-status/donors/${encodeURIComponent(userId)}/status`, payload);
    return res.data?.data || res.data;
  },

  heartbeat: async (platform?: string, currentRoute?: string) => {
    const res = await apiClient.post('/../active-status/heartbeat', {
      clientTime: new Date().toISOString(),
      platform,
      currentRoute
    });
    return res.data?.data || res.data;
  },

  getActiveRequests: async (filters?: any) => {
    const res = await apiClient.get('/../active-status/requests', { params: filters });
    return res.data?.data || res.data;
  },

  updateRequestStatus: async (requestId: string, status: string, changedBy?: string, reason?: string) => {
    const res = await apiClient.put(`/../active-status/requests/${encodeURIComponent(requestId)}/status`, { status, changedBy, reason });
    return res.data?.data || res.data;
  },

  getAuditHistory: async (limit: number = 30) => {
    const res = await apiClient.get('/../active-status/audit-history', { params: { limit } });
    return res.data?.data || res.data;
  },

  subscribeToLiveStream: (onEvent: (data: any) => void, onError?: (err: any) => void) => {
    if (typeof window === 'undefined' || !window.EventSource) {
      return () => {};
    }

    // Using apiClient.defaults.baseURL to properly construct the SSE URL in React Native
    const baseURL = apiClient.defaults.baseURL?.replace('/v1', '') || '';
    let eventSource: EventSource | null = new EventSource(`${baseURL}/active-status/stream`);

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onEvent(parsed);
      } catch (e) {
        // keepalive or non-json message
      }
    };

    eventSource.onerror = (err) => {
      if (onError) onError(err);
    };

    return () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  }
};
