import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { StatusBadge } from '../common/StatusBadge';

export interface DonorCardProps {
  name: string;
  bloodGroup: string;
  location?: string;
  donorStatus?: string;
  totalDonations?: number;
  lastDonationDate?: string | Date | null;
  onRequestContact: () => void;
  isRequested?: boolean;
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
}) => {
  const isAvailable = donorStatus === 'ACTIVE';

  const formatLastDonation = (dateStr: any) => {
    if (!dateStr) return 'First-time Donor';
    try {
      const d = new Date(dateStr);
      return `Last donated: ${d.toLocaleDateString()}`;
    } catch {
      return 'Regular Donor';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        {/* Blood Group Badge */}
        <View style={styles.bloodBadge}>
          <Text style={styles.bloodText}>{bloodGroup}</Text>
        </View>

        {/* Core Info */}
        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <StatusBadge status={isAvailable ? 'ACTIVE' : 'SUSPENDED'} />
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#64748B" />
            <Text style={styles.locationText} numberOfLines={1}>
              {location || 'Nepal (Broad Area)'}
            </Text>
          </View>
        </View>
      </View>

      {/* Meta Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="heart-circle-outline" size={14} color={colors.primary} />
          <Text style={styles.statText}>
            {totalDonations > 0 ? `${totalDonations} Donations` : 'New Donor'}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={14} color="#64748B" />
          <Text style={styles.statText}>{formatLastDonation(lastDonationDate)}</Text>
        </View>
      </View>

      {/* Action and Privacy Note */}
      <View style={styles.actionRow}>
        <View style={styles.privacyNoteBox}>
          <Ionicons name="shield-checkmark" size={13} color="#10B981" />
          <Text style={styles.privacyNote}>
            Contact details visible only after donor consent
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.contactButton, isRequested && styles.contactButtonDisabled]}
          onPress={onRequestContact}
          disabled={isRequested}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isRequested ? 'checkmark' : 'paper-plane-outline'}
            size={14}
            color="#FFFFFF"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.contactButtonText}>
            {isRequested ? 'Requested' : 'Request Contact'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bloodBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  bloodText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#64748B',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  privacyNoteBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  privacyNote: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 14,
    flex: 1,
  },
  contactButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    minHeight: 40,
  },
  contactButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
