import { useState, useEffect } from 'react';
import { useDonationStore } from '../store/donationStore';

export interface CooldownCountdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isResting: boolean;
  formattedRemaining: string;
}

/**
 * Reactive hook for live 90-day cooldown countdown ticking every second.
 */
export const useCooldownCountdown = (): CooldownCountdown => {
  const { nextEligibleDate, syncCooldown } = useDonationStore();
  const [, setTick] = useState(0);

  useEffect(() => {
    syncCooldown();
  }, [syncCooldown]);

  useEffect(() => {
    if (!nextEligibleDate) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [nextEligibleDate]);

  if (!nextEligibleDate) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isResting: false,
      formattedRemaining: 'Eligible to donate',
    };
  }

  const targetTime = new Date(nextEligibleDate).getTime();
  const diff = targetTime - Date.now();

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isResting: false,
      formattedRemaining: 'Eligible to donate',
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    isResting: true,
    formattedRemaining: `${days}d ${hours}h ${minutes}m ${seconds}s remaining`,
  };
};
