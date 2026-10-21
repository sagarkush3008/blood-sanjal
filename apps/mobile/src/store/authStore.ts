import { create } from 'zustand';
import { storage } from '../utils/storage';
import { AuthAPI } from '../api/auth.api';
import { flushAllQueryCaches } from '../api/queryClient';
import { useDonationStore } from './donationStore';

export interface UserProfile {
  id: string;
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'USER' | 'ADMIN' | 'HOSPITAL' | 'BLOOD_BANK' | 'NGO' | 'CAMPAIGN_ORGANIZER';
  status: 'ACTIVE' | 'SUSPENDED' | 'UNVERIFIED';
  bloodGroup?: string;
  districtId?: string;
  cityId?: string;
  avatarAssetId?: string;
  totalDonations?: number;
  privacySettings?: {
    donorSearchVisibility?: boolean;
    contactRevealPolicy?: string;
    emergencyNotifications?: boolean;
  };
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  setAuth: (token: string, user: any, refreshToken?: string) => Promise<void>;
  updateToken: (newToken: string, newRefreshToken?: string) => Promise<void>;
  setUser: (user: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,

  setAuth: async (token: string, user: any, refreshToken?: string) => {
    // 1. Flush any stale query cache from previous account to ensure complete isolation
    flushAllQueryCaches();

    try {
      await storage.setItem('accessToken', token);
      if (refreshToken) {
        await storage.setItem('refreshToken', refreshToken);
      }
      if (user) {
        const normalizedUser: UserProfile = {
          id: user.id || user._id,
          _id: user._id || user.id,
          name: user.name || 'User',
          email: user.email,
          phone: user.phone,
          role: user.role || 'USER',
          status: user.status || 'ACTIVE',
          bloodGroup: user.bloodGroup,
          avatarAssetId: user.avatarAssetId,
          privacySettings: user.privacySettings,
        };
        await storage.setItem('user', JSON.stringify(normalizedUser));

        // 2. Synchronize isolated donation cooldown specifically for this user
        await useDonationStore.getState().syncCooldown(normalizedUser.id);

        set({ token, user: normalizedUser, isLoading: false });
        return;
      }
    } catch (e) {
      console.warn('[useAuthStore] Failed to save auth to storage', e);
    }
    set({ token, user, isLoading: false });
  },

  updateToken: async (newToken: string, newRefreshToken?: string) => {
    try {
      await storage.setItem('accessToken', newToken);
      if (newRefreshToken) {
        await storage.setItem('refreshToken', newRefreshToken);
      }
    } catch (e) {
      console.warn('[useAuthStore] Failed to update token in storage', e);
    }
    set({ token: newToken });
  },

  setUser: async (user: UserProfile) => {
    try {
      await storage.setItem('user', JSON.stringify(user));
    } catch (e) {
      console.warn('[useAuthStore] Failed to cache user in storage', e);
    }
    set({ user });
  },

  logout: async () => {
    try {
      // Best-effort server side revocation
      await AuthAPI.logout().catch(() => {});
    } catch {}

    // 1. Wipe all React Query in-memory caches across all components
    flushAllQueryCaches();

    // 2. Reset donation cooldown global state and wipe persisted cooldown from storage
    const currentUserId = get().user?.id;
    await useDonationStore.getState().clearCooldown(currentUserId);

    try {
      await storage.deleteItem('accessToken');
      await storage.deleteItem('refreshToken');
      await storage.deleteItem('user');
    } catch (e) {
      console.warn('[useAuthStore] Failed to clear storage on logout', e);
    }
    set({ token: null, user: null, isLoading: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await storage.getItem('accessToken');
      const userStr = await storage.getItem('user');
      const cachedUser = userStr ? JSON.parse(userStr) : null;

      if (!token) {
        set({ token: null, user: null, isLoading: false });
        return;
      }

      // Optimistically restore cached state
      set({ token, user: cachedUser });

      // Fetch live authoritative state from /me
      try {
        const response = await AuthAPI.getCurrentUser();
        // The response interceptor already unwraps { success, data } → data
        const profile = response.data;
        if (profile) {
          const freshUser: UserProfile = {
            id: profile._id || profile.id,
            _id: profile._id || profile.id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            role: profile.role,
            status: profile.status,
            bloodGroup: profile.bloodGroup,
            districtId: profile.districtId,
            cityId: profile.cityId,
            avatarAssetId: profile.avatarAssetId,
            privacySettings: profile.privacySettings,
          };
          await storage.setItem('user', JSON.stringify(freshUser));
          await useDonationStore.getState().syncCooldown(freshUser.id);
          set({ user: freshUser, isLoading: false });
          return;
        }
      } catch (err: any) {
        // If 401 (unauthorized) or 404 (user deleted) and refresh fails, clean up
        if (err.response?.status === 401 || err.response?.status === 404) {
          flushAllQueryCaches();
          await useDonationStore.getState().clearCooldown();
          await storage.deleteItem('accessToken');
          await storage.deleteItem('refreshToken');
          await storage.deleteItem('user');
          set({ token: null, user: null, isLoading: false });
          return;
        }
      }

      // If network is offline or server unreachable, rely on valid cached session
      set({ isLoading: false });
    } catch (e) {
      console.error('[useAuthStore] Failed to load session', e);
      set({ token: null, user: null, isLoading: false });
    }
  },
}));
