import { apiClient } from './client';

export const FilesAPI = {
  // Request Cloudinary signature/upload params
  getUploadParams: (data: { type: string, folder: string }) => apiClient.post('/files/upload-params', data),
  // After upload to Cloudinary, confirm the asset with our backend
  confirmUpload: (data: any) => apiClient.post('/files/confirm', data),
};
