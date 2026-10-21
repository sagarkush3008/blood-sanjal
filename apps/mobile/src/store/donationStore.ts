import { create } from 'zustand';
import { storage } from '../utils/storage';

export interface DonationCooldownState {
  lastDonationDate: string | null;
  nextEligibleDate: string | null;
  isResting: boolean;
  setCooldown: (donationDate: string | Date) => Promise<{ nextEligibleDate: string }>;
  clearCooldown: () => Promise<void>;
  syncCooldown: () => Promise<void>;
}

/**
 * ISOLATED GLOBAL STATE STORE: 90-Day Donation Cooldown & Medical Recovery.
 * 
 * ARCHITECTURAL DIRECTIVE:
 * This store strictly manages medical donation cooldown variables:
 * - lastDonationDate: Timestamp of blood donation event
 * - nextEligibleDate: 90-day medical resting expiration timestamp
 * - isResting: Boolean flag indicating if donor is within the 90-day medical window
 * 
 * STRICT DECOUPLING RULE:
 * This store is 100% DECOUPLED from manual donor availability status:
 * - Does NOT touch or alter `isActive`, `donorStatus` ('ACTIVE'/'INACTIVE')
 * - Does NOT touch or alter `pause_duration`, `inactive_until`, or snooze timers
 * Manual availability is ONLY mutated when the user explicitly interacts with the DonorAvailability section.
 */
export const useDonationStore = create<DonationCooldownState>((set) => ({
  lastDonationDate: null,
  nextEligibleDate: null,
  isResting: false,

  setCooldown: async (donationDate: string | Date) => {
    const d = new Date(donationDate);
    const donationIso = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();

    // Exactly 90 days = 90 * 24 * 60 * 60 * 1000 ms
    const nextEligibleTime = new Date(donationIso).getTime() + 90 * 24 * 60 * 60 * 1000;
    const nextEligibleIso = new Date(nextEligibleTime).toISOString();
    const isResting = nextEligibleTime > Date.now();

    try {
      await storage.setItem('last_donation_date', donationIso);
      await storage.setItem('next_eligible_date', nextEligibleIso);
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

  clearCooldown: async () => {
    try {
      await storage.deleteItem('last_donation_date');
      await storage.deleteItem('next_eligible_date');
    } catch {}

    set({
      lastDonationDate: null,
      nextEligibleDate: null,
      isResting: false,
    });
  },

  syncCooldown: async () => {
    try {
      const storedLast = await storage.getItem('last_donation_date');
      const storedNext = await storage.getItem('next_eligible_date');

      if (storedNext) {
        const isResting = new Date(storedNext).getTime() > Date.now();
        set({
          lastDonationDate: storedLast,
          nextEligibleDate: storedNext,
          isResting,
        });
      }
    } catch (e) {
      console.warn('[DonationStore] Failed to sync cooldown from storage:', e);
    }
  },
}));
