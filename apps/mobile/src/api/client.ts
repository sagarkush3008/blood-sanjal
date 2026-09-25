import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { NativeModules, Platform } from 'react-native';

// Dynamically grab the local IP address of the machine running Expo
let HOST = 'localhost';
if (__DEV__) {
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    const address = scriptURL.split('://')[1].split('/')[0];
    HOST = address.split(':')[0];
  } else {
    HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  }
}

export const API_BASE_URL = `http://${HOST}:5000/api/v1`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error('Error fetching token from SecureStore', err);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized: Token might be expired.');
      // Handle refresh token logic or logout here when the auth module is implemented
    }
    return Promise.reject(error);
  }
);
