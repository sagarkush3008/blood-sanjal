import { apiClient } from './client';

export const NotificationsAPI = {
  list: (params?: any) => apiClient.get('/notifications', { params }),
  markAsRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.patch('/notifications/read-all'),
};
