import { create } from 'zustand';
import { storage } from '../utils/storage';

export interface DonationCooldownState {
  lastDonationDate: string | null;
  nextEligibleDate: string | null;
  isResting: boolean;
  setCooldown: (donationDate: string | Date, userId?: string) => Promise<{ nextEligibleDate: string }>;
  clearCooldown: (userId?: string) => Promise<void>;
  syncCooldown: (userId?: string) => Promise<void>;
}

export const useDonationStore = create<DonationCooldownState>((set) => ({
  lastDonationDate: null,
  nextEligibleDate: null,
  isResting: false,

  setCooldown: async (donationDate: string | Date, userId?: string) => {
    const d = new Date(donationDate);
    const donationIso = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();

    // Exactly 90 days = 90 * 24 * 60 * 60 * 1000 ms
    const nextEligibleTime = new Date(donationIso).getTime() + 90 * 24 * 60 * 60 * 1000;
    const nextEligibleIso = new Date(nextEligibleTime).toISOString();
    const isResting = nextEligibleTime > Date.now();

    try {
      await storage.setItem('last_donation_date', donationIso);
      await storage.setItem('next_eligible_date', nextEligibleIso);
      if (userId) {
        await storage.setItem(`last_donation_date_${userId}`, donationIso);
        await storage.setItem(`next_eligible_date_${userId}`, nextEligibleIso);
      }
    } catch (e) {
      console.warn('[DonationStore] Failed to persist cooldown state to storage:', e);
    }

    set({
      lastDonationDate: donationIso,
      nextEligibleDate: nextEligibleIso,
      isResting,
    });

    return { nextEligibleDate: nextEligibleIso };
  },

  clearCooldown: async (userId?: string) => {
    try {
      await storage.deleteItem('last_donation_date');
      await storage.deleteItem('next_eligible_date');
      if (userId) {
        await storage.deleteItem(`last_donation_date_${userId}`);
        await storage.deleteItem(`next_eligible_date_${userId}`);
      }
    } catch {}

    set({
      lastDonationDate: null,
      nextEligibleDate: null,
      isResting: false,
    });
  },

  syncCooldown: async (userId?: string) => {
    try {
      const lastKey = userId ? `last_donation_date_${userId}` : 'last_donation_date';
      const nextKey = userId ? `next_eligible_date_${userId}` : 'next_eligible_date';

      let storedLast = await storage.getItem(lastKey);
      let storedNext = await storage.getItem(nextKey);

      // Fallback only if no user specified
      if (!storedNext && !userId) {
        storedLast = await storage.getItem('last_donation_date');
        storedNext = await storage.getItem('next_eligible_date');
      }

      if (storedNext) {
        const isResting = new Date(storedNext).getTime() > Date.now();
        set({
          lastDonationDate: storedLast,
          nextEligibleDate: storedNext,
          isResting,
        });
      } else {
        set({
          lastDonationDate: null,
          nextEligibleDate: null,
          isResting: false,
        });
      }
    } catch (e) {
      console.warn('[DonationStore] Failed to sync cooldown from storage:', e);
    }
  },
}));
