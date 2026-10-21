import axios, { AxiosError } from 'axios';
import { NativeModules, Platform } from 'react-native';
import { storage } from '../utils/storage';

// Laptop Wi-Fi IPv4 address on the local network
const LOCAL_DEV_API_URL = 'http://192.168.1.70:5000/api/v1';

const ACTIVE_TUNNEL_URL = 'https://preliminary-tramadol-polymer-social.trycloudflare.com/api/v1';

// Dynamic Backend Host Detection
export const getApiBaseUrl = (): string => {
  // 1. Web environment (Laptop browser preview) - ALWAYS talk directly to local backend!
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      return `http://${hostname || 'localhost'}:5000/api/v1`;
    }
    return 'http://localhost:5000/api/v1';
  }

  // 2. Automatic Local Wi-Fi Detection for physical phones (Extract host IP from Metro Bundler)
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^/:]+)(?::\d+)?/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return `http://${match[1]}:5000/api/v1`;
      }
    }
  } catch (e) {
    // fallback
  }

  // 3. If explicit env URL is provided and not an expired temporary tunnel
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (
    envUrl &&
    !envUrl.includes('.trycloudflare.com')
  ) {
    return envUrl;
  }

  // 4. Fallback for physical devices
  return LOCAL_DEV_API_URL || ACTIVE_TUNNEL_URL;
};

export const API_BASE_URL = getApiBaseUrl();

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
      config.baseURL = getApiBaseUrl();
      const token = await storage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error('[apiClient] Error fetching token from storage', err);
    }
    if (__DEV__) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url}`);
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

        const refreshResponse = await axios.post(`${getApiBaseUrl()}/auth/refresh`, {
          refreshToken: storedRefreshToken,
        });

        // This uses raw axios (not apiClient), so no interceptor unwrap — manual unwrap needed
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
