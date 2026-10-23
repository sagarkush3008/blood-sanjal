import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, colors } from '../../theme';
import { cleanLocationName } from '../../utils/locationHelper';

export interface LocationObject {
  name?: string;
  cityName?: string;
  city?: string;
  district?: string;
  province?: string;
  address?: string;
  [key: string]: any;
}

export type LocationProp = string | LocationObject | null | undefined;

/**
 * Strict helper to sanitize and format readable location.
 * Guarantees database hashes or raw IDs are never leaked to UI.
 */
export const formatLocation = (loc?: LocationProp): string => {
  if (!loc) return 'Location Not Set';

  let candidate: string = '';
  if (typeof loc === 'object') {
    candidate =
      loc.name ||
      loc.cityName ||
      loc.city ||
      loc.district ||
      loc.province ||
      loc.address ||
      '';
  } else if (typeof loc === 'string') {
    candidate = loc;
  }

  const trimmed = candidate.trim();
  if (!trimmed) return 'Location Not Set';

  // Defensive check for raw DB IDs or UUIDs
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(trimmed);
  const isUuid = /^[0-9a-fA-F-]{36}$/.test(trimmed);
  const isLongHash = trimmed.length > 20 && !trimmed.includes(' ');
  if (isMongoId || isUuid || isLongHash) {
    return 'Nepal';
  }

  return cleanLocationName ? cleanLocationName(trimmed) : trimmed;
};

const getInitials = (fullName?: string): string => {
  if (!fullName) return 'VD';
  const cleaned = fullName.replace(/\(.*?\)/g, '').trim(); // Remove suffixes like (Donor 1)
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'VD';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export interface DonorCardProps {
  name: string;
  bloodGroup: string;
  location?: LocationProp;
  donorStatus?: string;
  totalDonations?: number;
  lastDonationDate?: string | Date | null;
  onRequestContact: () => void;
  isRequested?: boolean;
  inactiveUntil?: string | Date | null;
  inactiveReason?: string | null;
  reminderDate?: string | Date | null;
  distance?: number | string;
  verified?: boolean;
}

export const DonorCard: React.FC<DonorCardProps> = ({
  name,
  bloodGroup,
  location,
  donorStatus = 'ACTIVE',
  totalDonations = 0,
  lastDonationDate,
  onRequestContact,
  isRequested = false,
  inactiveUntil,
  inactiveReason,
  reminderDate,
  distance,
  verified = true,
}) => {
  const isAvailable = donorStatus === 'ACTIVE';

  // Check if donor is in recovery phase
  let isRecovering = false;
  let recoveryDaysText = '';
  if (reminderDate) {
    const rd = new Date(reminderDate);
    const now = new Date();
    if (rd > now) {
      isRecovering = true;
      const diffDays = Math.ceil((rd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      recoveryDaysText = `${diffDays}d recovery`;
    }
  }

  const initials = getInitials(name);
  const displayLocation = formatLocation(location);
  const locationWithDistance = distance
    ? `${displayLocation} • ${typeof distance === 'number' ? `${(distance / 1000).toFixed(1)} km` : distance}`
    : displayLocation;

  return (
    <View style={styles.card}>
      {/* 1. Header Row (Avatar, Details, Verified Badge) */}
      <View style={styles.headerRow}>
        {/* Left: Circular Avatar with Initials & Subtle Blood Tag */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          {bloodGroup ? (
            <View style={styles.avatarBloodTag}>
              <Text style={styles.avatarBloodText}>{bloodGroup}</Text>
            </View>
          ) : null}
        </View>

        {/* Middle: Donor's Name & Location */}
        <View style={styles.detailsCol}>
          <Text style={styles.donorName} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={12} color="#94A3B8" style={styles.pinIcon} />
            <Text style={styles.locationText} numberOfLines={1}>
              {locationWithDistance}
            </Text>
          </View>
        </View>

        {/* Right: Pill-shaped Badge */}
        <View style={styles.badgeContainer}>
          {isRecovering ? (
            <View style={styles.recoveringBadge}>
              <Text style={styles.recoveringBadgeText}>{recoveryDaysText}</Text>
            </View>
          ) : isAvailable ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#16A34A" style={{ marginRight: 3 }} />
              <Text style={styles.verifiedBadgeText}>Verified</Text>
            </View>
          ) : (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>Inactive</Text>
            </View>
          )}
        </View>
      </View>

      {/* Subtle Horizontal Divider */}
      <View style={styles.divider} />

      {/* 2. Professional Contact Action Button */}
      <TouchableOpacity
        style={[
          styles.contactButton,
          isRequested && styles.contactButtonRequested,
          (!isAvailable && !isRecovering) && styles.contactButtonDisabled,
        ]}
        onPress={onRequestContact}
        disabled={isRequested || (!isAvailable && !isRecovering)}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={`Contact donor ${name}`}
      >
        <Ionicons
          name={isRequested ? 'checkmark' : 'call-outline'}
          size={15}
          color={isRequested ? '#16A34A' : '#DC2626'}
          style={styles.contactBtnIcon}
        />
        <Text
          style={[
            styles.contactButtonText,
            isRequested && styles.contactButtonTextRequested,
          ]}
        >
          {isRequested ? 'Contact Requested' : 'Contact Donor'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 0, // Absolutely no harsh borders
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, // Very faint, elegant drop shadow
    shadowRadius: 10,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6', // Soft light gray
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#374151', // Dark gray
    letterSpacing: -0.3,
  },
  avatarBloodTag: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarBloodText: {
    fontSize: 8.5,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  donorName: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#111827', // Dark charcoal
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinIcon: {
    marginRight: 3,
  },
  locationText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#6B7280', // Soft gray
    letterSpacing: -0.1,
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4', // Ultra-light green background
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: '#16A34A', // Emerald text
    letterSpacing: -0.1,
  },
  recoveringBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recoveringBadgeText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#D97706',
  },
  inactiveBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inactiveBadgeText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#94A3B8',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6', // Subtle horizontal divider
    marginTop: 14,
    marginBottom: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: '#FEF2F2', // Very light red background
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  contactButtonRequested: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  contactButtonDisabled: {
    opacity: 0.5,
  },
  contactBtnIcon: {
    marginRight: 7,
  },
  contactButtonText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#DC2626', // Brand Red text
    letterSpacing: -0.1,
  },
  contactButtonTextRequested: {
    color: '#16A34A',
  },
});
