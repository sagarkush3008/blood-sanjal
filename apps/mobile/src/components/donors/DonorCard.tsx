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
  inactiveUntil?: string | Date | null;
  inactiveReason?: string | null;
  reminderDate?: string | Date | null;
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
}) => {
  const isAvailable = donorStatus === 'ACTIVE';

  let isRecovering = false;
  let recoveryDateStr = null;
  let recoveryRelativeText = null;

  if (reminderDate) {
    const rd = new Date(reminderDate);
    const now = new Date();
    if (rd > now) {
      isRecovering = true;
      recoveryDateStr = rd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const diffDays = Math.ceil((rd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      recoveryRelativeText = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
  }

  let relativeText = null;
  let exactTimeText = null;
  
  if (!isAvailable && inactiveUntil) {
    const untilDate = new Date(inactiveUntil);
    const now = new Date();
    const diffMs = untilDate.getTime() - now.getTime();
    
    if (diffMs > 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) {
        relativeText = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
      } else if (diffHours > 0) {
        relativeText = `${diffHours} hr${diffHours > 1 ? 's' : ''}`;
      } else {
        relativeText = `< 1 hr`;
      }
      
      const timeStr = untilDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const dateStr = untilDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      exactTimeText = `${dateStr}, ${timeStr}`;
    } else {
       relativeText = 'Shortly';
       exactTimeText = 'Any moment now';
    }
  }

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

      {/* Meta Stats Row / Inactive Box */}
      {isAvailable || !inactiveUntil ? (
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
      ) : (
        <View style={styles.inactivePremiumBox}>
           <View style={styles.inactivePremiumHeader}>
             <Ionicons name="moon" size={12} color="#FCA5A5" style={{ marginRight: 4 }} />
             <Text style={styles.inactivePremiumTitle}>Temporarily Unavailable</Text>
           </View>
           
           {inactiveReason && (
             <Text style={styles.inactivePremiumReason}>"{inactiveReason}"</Text>
           )}

           {relativeText && (
             <View style={styles.returnTimeWrapper}>
               <View style={styles.returnTimeItem}>
                 <Text style={styles.returnTimeLabel}>RETURNING IN</Text>
                 <Text style={styles.returnTimeValue}>{relativeText}</Text>
               </View>
               <View style={styles.returnTimeDivider} />
               <View style={styles.returnTimeItem}>
                 <Text style={styles.returnTimeLabel}>EXACT TIME</Text>
                 <Text style={styles.returnTimeValue}>{exactTimeText}</Text>
               </View>
             </View>
           )}
        </View>
      )}

      {/* Action and Privacy Note */}
      <View style={styles.actionRow}>
        <View style={styles.privacyNoteBox}>
          <Ionicons name="shield-checkmark" size={13} color="#10B981" />
          <Text style={styles.privacyNote}>
            Contact details visible only after donor consent
          </Text>
        </View>

        {isRecovering ? (
          <View style={styles.recoveryBadge}>
            <Ionicons name="medical-outline" size={14} color="#D97706" style={{ marginRight: 4 }} />
            <Text style={styles.recoveryBadgeText}>Recovering ({recoveryRelativeText})</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.contactButton, (isRequested || !isAvailable) && styles.contactButtonDisabled]}
            onPress={onRequestContact}
            disabled={isRequested || !isAvailable}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isRequested ? 'checkmark' : 'paper-plane-outline'}
              size={14}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.contactButtonText}>
              {isRequested ? 'Requested' : (!isAvailable ? 'Unavailable' : 'Request Contact')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {isRecovering && (
        <View style={styles.recoveryNoticeBox}>
          <Text style={styles.recoveryNoticeText}>
            This donor recently donated blood and is in a medically required recovery phase. They will be eligible to donate again on <Text style={{ fontWeight: 'bold' }}>{recoveryDateStr}</Text>.
          </Text>
        </View>
      )}
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
  
  inactivePremiumBox: { backgroundColor: '#FFF1F2', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#FFE4E6' },
  inactivePremiumHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  inactivePremiumTitle: { fontSize: 11, fontWeight: '800', color: '#E11D48', letterSpacing: 0.5 },
  inactivePremiumReason: { fontSize: 12, color: '#BE123C', fontStyle: 'italic', marginBottom: 10 },
  returnTimeWrapper: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  returnTimeItem: { flex: 1 },
  returnTimeLabel: { fontSize: 9, fontWeight: '800', color: '#F43F5E', marginBottom: 2, letterSpacing: 0.5 },
  returnTimeValue: { fontSize: 13, fontWeight: '800', color: '#881337' },
  returnTimeDivider: { width: 1, height: '100%', backgroundColor: '#FECACA', marginHorizontal: 8 },

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
  recoveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  recoveryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  recoveryNoticeBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  recoveryNoticeText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  }
});
