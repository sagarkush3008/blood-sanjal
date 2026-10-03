import axios, { AxiosError } from 'axios';
import { NativeModules, Platform } from 'react-native';
import { storage } from '../utils/storage';

// Dynamically grab the local IP address of the machine running Expo
let HOST = 'localhost';
if (__DEV__) {
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    const address = scriptURL.split('://')[1]?.split('/')[0];
    HOST = address?.split(':')[0] || 'localhost';
  } else {
    HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  }
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${HOST}:5000/api/v1`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach access token to every outgoing request
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error('[apiClient] Error fetching token from storage', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Token refresh synchronization queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    // Automatically unwrap the SuccessResponse envelope if present
    if (response.data && response.data.success === true && response.data.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error: AxiosError<any>) => {
    const originalRequest: any = error.config;

    // Handle 401 Unauthorized with Token Refresh
    if (error.response?.status === 401 && !originalRequest?._retry) {
      // Don't loop if the failing endpoint was auth/refresh or auth/login
      if (
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/login')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = await storage.getItem('refreshToken');
        if (!storedRefreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: storedRefreshToken,
        });

        const data = refreshResponse.data?.data || refreshResponse.data;
        const newAccessToken = data?.accessToken;
        const newRefreshToken = data?.refreshToken;

        if (newAccessToken) {
          await storage.setItem('accessToken', newAccessToken);
          if (newRefreshToken) {
            await storage.setItem('refreshToken', newRefreshToken);
          }
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } else {
          throw new Error('Refresh response missing access token');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Force complete logout on refresh failure
        try {
          const { useAuthStore } = require('../store/authStore');
          useAuthStore.getState().logout();
        } catch (e) {
          await storage.deleteItem('accessToken');
          await storage.deleteItem('refreshToken');
          await storage.deleteItem('user');
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
