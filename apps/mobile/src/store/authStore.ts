import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  token: string | null;
  user: any | null; // will be replaced with proper User type
  isLoading: boolean;
  setAuth: (token: string, user: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,
  setAuth: async (token, user) => {
    await SecureStore.setItemAsync('accessToken', token);
    set({ token, user, isLoading: false });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    set({ token: null, user: null, isLoading: false });
  },
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        // Ideally, we'd fetch the user profile here, but for now we just restore the token
        set({ token, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      console.error('Failed to load auth token', e);
      set({ isLoading: false });
    }
  }
}));
