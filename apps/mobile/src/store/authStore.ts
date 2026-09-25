import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  token: string | null;
  user: any | null;
  isLoading: boolean;
  setAuth: (token: string, user: any, refreshToken?: string) => Promise<void>;
  updateToken: (newToken: string, newRefreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,
  setAuth: async (token, user, refreshToken) => {
    try {
      await SecureStore.setItemAsync('accessToken', token);
      if (refreshToken) {
        await SecureStore.setItemAsync('refreshToken', refreshToken);
      }
      if (user) {
        await SecureStore.setItemAsync('user', JSON.stringify(user));
      }
    } catch (e) {
      console.warn('Failed to save auth to SecureStore', e);
    }
    set({ token, user, isLoading: false });
  },
  updateToken: async (newToken, newRefreshToken) => {
    try {
      await SecureStore.setItemAsync('accessToken', newToken);
      if (newRefreshToken) {
        await SecureStore.setItemAsync('refreshToken', newRefreshToken);
      }
    } catch (e) {
      console.warn('Failed to update token in SecureStore', e);
    }
    set({ token: newToken });
  },
  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('user');
    } catch (e) {
      console.warn('Failed to clear SecureStore on logout', e);
    }
    set({ token: null, user: null, isLoading: false });
  },
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const userStr = await SecureStore.getItemAsync('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (token) {
        set({ token, user, isLoading: false });
      } else {
        set({ token: null, user: null, isLoading: false });
      }
    } catch (e) {
      console.error('Failed to load auth token', e);
      set({ token: null, user: null, isLoading: false });
    }
  }
}));
