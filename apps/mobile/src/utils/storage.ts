import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// In-memory cache guarantees 0ms instantaneous read availability
// eliminating asynchronous native bridge race conditions upon login
const memoryCache = new Map<string, string>();

export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (memoryCache.has(key)) {
      return memoryCache.get(key) ?? null;
    }

    if (Platform.OS === 'web') {
      try {
        const val = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
        if (val !== null) memoryCache.set(key, val);
        return val;
      } catch {
        return null;
      }
    }

    try {
      const val = await SecureStore.getItemAsync(key);
      if (val !== null) memoryCache.set(key, val);
      return val;
    } catch (e) {
      console.warn(`[storage] Failed to get ${key} from SecureStore`, e);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    // 1. Immediately cache in memory for 0ms synchronous read access
    memoryCache.set(key, value);

    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
      } catch {}
      return;
    }

    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn(`[storage] Failed to set ${key} in SecureStore`, e);
      throw e;
    }
  },

  async deleteItem(key: string): Promise<void> {
    memoryCache.delete(key);

    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      } catch {}
      return;
    }

    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn(`[storage] Failed to delete ${key} from SecureStore`, e);
    }
  },

  clearMemoryCache(): void {
    memoryCache.clear();
  },
};
