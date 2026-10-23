import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { fonts } from '../../theme';

export interface CooldownTimerCardProps {
  nextEligibleDate?: string | null;
  lastDonationDate?: string | null;
  showResetButton?: boolean;
  onResetCooldown?: () => void;
  isResettingCooldown?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export const CooldownTimerCard: React.FC<CooldownTimerCardProps> = ({
  nextEligibleDate,
  lastDonationDate,
  showResetButton = false,
  onResetCooldown,
  isResettingCooldown = false,
  containerStyle,
}) => {
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { countdown, nextEligibleTime } = useMemo(() => {
    if (!nextEligibleDate) {
      return {
        nextEligibleTime: null,
        countdown: { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 },
      };
    }

    const targetDate = new Date(nextEligibleDate);
    const targetMs = targetDate.getTime();
    if (isNaN(targetMs)) {
      return {
        nextEligibleTime: null,
        countdown: { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 },
      };
    }

    const diffMs = targetMs - currentTime;
    if (diffMs <= 0) {
      return {
        nextEligibleTime: targetMs,
        countdown: { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 },
      };
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return {
      nextEligibleTime: targetMs,
      countdown: { days, hours, minutes, seconds, totalMs: diffMs },
    };
  }, [nextEligibleDate, currentTime]);

  const formattedNextEligibleDate = useMemo(() => {
    if (!nextEligibleTime) return 'Today';
    const d = new Date(nextEligibleTime);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  }, [nextEligibleTime]);

  const formattedLastDonation = useMemo(() => {
    if (!lastDonationDate) return 'None recorded';
    const d = new Date(lastDonationDate);
    if (isNaN(d.getTime())) return 'None recorded';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  }, [lastDonationDate]);

  return (
    <View style={[styles.activeTimerCard, containerStyle]}>
      {/* 4-PART DIGITAL COUNTDOWN TIMER (Days, Hours, Minutes, Seconds) */}
      <View style={styles.countdownBoxesContainer}>
        <View style={styles.countdownBox}>
          <Text style={styles.countdownDigitText}>
            {String(countdown.days).padStart(2, '0')}
          </Text>
          <Text style={styles.countdownUnitText}>DAYS</Text>
        </View>
        <Text style={styles.countdownSeparatorText}>:</Text>

        <View style={styles.countdownBox}>
          <Text style={styles.countdownDigitText}>
            {String(countdown.hours).padStart(2, '0')}
          </Text>
          <Text style={styles.countdownUnitText}>HOURS</Text>
        </View>
        <Text style={styles.countdownSeparatorText}>:</Text>

        <View style={styles.countdownBox}>
          <Text style={styles.countdownDigitText}>
            {String(countdown.minutes).padStart(2, '0')}
          </Text>
          <Text style={styles.countdownUnitText}>MINS</Text>
        </View>
        <Text style={styles.countdownSeparatorText}>:</Text>

        <View style={styles.countdownBox}>
          <Text style={styles.countdownDigitText}>
            {String(countdown.seconds).padStart(2, '0')}
          </Text>
          <Text style={styles.countdownUnitText}>SECS</Text>
        </View>
      </View>

      {/* Footer Meta Row: Last Donation & Eligible Date */}
      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <Ionicons name="shield-checkmark" size={13} color="#16A34A" />
          <Text style={styles.metaPillText}>Last: {formattedLastDonation}</Text>
        </View>
        <View style={styles.metaPill}>
          <Ionicons name="calendar-outline" size={13} color="#6B7280" />
          <Text style={styles.metaPillText}>Eligible: {formattedNextEligibleDate}</Text>
        </View>
      </View>

      {/* Reset Cooldown (Only for test account) */}
      {showResetButton && onResetCooldown && (
        <View style={styles.resetRow}>
          <TouchableOpacity
            style={styles.resetCooldownPill}
            onPress={onResetCooldown}
            disabled={isResettingCooldown}
            activeOpacity={0.7}
          >
            <Feather name="refresh-cw" size={12} color="#DC2626" />
            <Text style={styles.resetCooldownPillText}>
              {isResettingCooldown ? 'Resetting...' : 'Reset Cooldown (Test)'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  activeTimerCard: {
    width: '100%',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  countdownBoxesContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  countdownBox: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  countdownDigitText: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: '#111827',
    letterSpacing: -0.5,
  },
  countdownUnitText: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: '#6B7280',
    letterSpacing: 0.5,
    marginTop: 3,
  },
  countdownSeparatorText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: '#D1D5DB',
    marginHorizontal: 3,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  metaPillText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#4B5563',
  },
  resetRow: {
    alignItems: 'center',
    marginTop: 6,
  },
  resetCooldownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resetCooldownPillText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#DC2626',
  },
});
