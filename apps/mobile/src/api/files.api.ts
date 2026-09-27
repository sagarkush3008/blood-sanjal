import { apiClient } from './client';

export const FilesAPI = {
  upload: (formData: FormData) =>
    apiClient.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getSignedUrl: (assetId: string) => apiClient.get(`/media/${assetId}/signed-url`),
  deleteAsset: (assetId: string) => apiClient.delete(`/media/${assetId}`),
};
