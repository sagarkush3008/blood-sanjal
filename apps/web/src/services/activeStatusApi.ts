export const activeStatusApi = {
  checkHealth: async () => ({ status: 'healthy', uptimeSeconds: 100, activeDonorsTotal: 10 }),
  getSummary: async () => ({
    serverUptimeSeconds: 100,
    onlineDonorsCount: 5,
    activeDonorsCount: 10,
    activeRequestsCount: 3,
    urgentRequestsCount: 1,
    lastUpdatedAt: new Date().toISOString()
  }),
  getDonors: async (arg?: any) => ({ data: [], count: 0 }),
  getDonorStatus: async (arg?: any) => ({}),
  updateDonorStatus: async (userId: string, payload: any) => ({ success: true }),
  heartbeat: async (arg1?: any, arg2?: any) => ({ success: true, isOnline: true }),
  sendHeartbeat: async (arg1?: any, arg2?: any) => ({ success: true, isOnline: true }),
  getActiveRequests: async (arg?: any) => ({ data: [], count: 0 }),
  updateRequestStatus: async (requestId: string, status: string, changedBy?: string, reason?: string) => ({ success: true }),
  getAuditHistory: async (limit: number = 30) => ({ logs: [] }),
  subscribeToLiveStream: (onEvent: (data: any) => void, onError?: (err: any) => void) => {
    return () => {};
  }
};
