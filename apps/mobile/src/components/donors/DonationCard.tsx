import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type DonationVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | string;

export interface DonationItemData {
  _id?: string;
  id?: string;
  hospitalName?: string;
  location?: string;
  donationType?: 'WHOLE_BLOOD' | 'PLATELETS' | 'PLASMA' | 'DOUBLE_RED_CELLS' | string;
  donationDate?: string | Date;
  status?: DonationVerificationStatus;
  verificationStatus?: DonationVerificationStatus;
  unitsDonated?: number;
  bloodGroup?: string;
  rejectionReason?: string;
  certificateId?: string;
  certificateNumber?: string;
  notes?: string;
}

export interface DonationCardProps {
  /** The donation record to display. Safely handles missing/partial data. */
  donation?: DonationItemData;
  /** Optional callback triggered when the main card is pressed */
  onPress?: (donation: DonationItemData) => void;
  /** Optional callback triggered when 'View Certificate' is tapped */
  onViewCertificate?: (certificateId: string) => void;
  /** Optional custom container style overrides */
  style?: StyleProp<ViewStyle>;
  /** Optional testID for automation tests */
  testID?: string;
}

/**
 * 100% Isolated Pure 'Dumb' Component for displaying a blood donation record.
 * - Zero external state/API dependencies.
 * - Fully scoped StyleSheet styles.
 * - Graceful fallback defaults for every prop.
 * - Self-contained internal accordion toggle state.
 */
export const DonationCard: React.FC<DonationCardProps> = ({
  donation = {},
  onPress,
  onViewCertificate,
  style,
  testID = 'donation-card',
}) => {
  // 4. Internal State Only: accordion expand/collapse
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Safe fallback extraction to avoid undefined crashes
  const id = donation._id || donation.id || 'unknown';
  const hospital = donation.hospitalName?.trim() || 'Certified Blood Bank';
  const location = donation.location?.trim() || '';
  const rawStatus = (donation.verificationStatus || donation.status || 'PENDING').toUpperCase();
  const normalizedStatus: DonationVerificationStatus =
    rawStatus === 'VERIFIED' || rawStatus === 'REJECTED' ? rawStatus : 'PENDING';

  const donationTypeFormatted = donation.donationType
    ? donation.donationType.replace(/_/g, ' ')
    : 'Whole Blood';

  const formattedDate = (() => {
    if (!donation.donationDate) return 'Recent';
    try {
      const d = new Date(donation.donationDate);
      if (isNaN(d.getTime())) return String(donation.donationDate);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  })();

  const units = donation.unitsDonated ? `${donation.unitsDonated} Unit(s)` : '1 Unit (450ml)';
  const bloodGroup = donation.bloodGroup ? donation.bloodGroup.toUpperCase() : null;

  // Status visual configurations (isolated locally)
  const statusConfig = {
    VERIFIED: {
      label: 'VERIFIED',
      textColor: '#15803D',
      bgColor: '#DCFCE7',
      borderColor: '#86EFAC',
      iconName: 'checkmark-circle' as const,
    },
    PENDING: {
      label: 'PENDING VERIFICATION',
      textColor: '#B45309',
      bgColor: '#FEF3C7',
      borderColor: '#FCD34D',
      iconName: 'time' as const,
    },
    REJECTED: {
      label: 'REJECTED',
      textColor: '#B91C1C',
      bgColor: '#FEE2E2',
      borderColor: '#FCA5A5',
      iconName: 'close-circle' as const,
    },
  }[normalizedStatus] || {
    label: normalizedStatus,
    textColor: '#475569',
    bgColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    iconName: 'information-circle' as const,
  };

  const handleCardPress = () => {
    if (onPress) {
      onPress(donation);
    } else {
      // Default interaction: toggle internal details
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <View style={[styles.cardContainer, style]} testID={testID}>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={handleCardPress}
        style={styles.touchableArea}
      >
        {/* Header Row: Hospital Name & Status Badge */}
        <View style={styles.topRow}>
          <View style={styles.hospitalRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="business" size={16} color="#B91C1C" />
            </View>
            <View style={styles.hospitalTextWrap}>
              <Text style={styles.hospitalName} numberOfLines={1}>
                {hospital}
              </Text>
              {location.length > 0 && (
                <View style={styles.locationWrap}>
                  <Ionicons name="location-sharp" size={11} color="#64748B" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {location}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.badgeContainer,
              {
                backgroundColor: statusConfig.bgColor,
                borderColor: statusConfig.borderColor,
              },
            ]}
          >
            <Ionicons
              name={statusConfig.iconName}
              size={12}
              color={statusConfig.textColor}
              style={styles.badgeIcon}
            />
            <Text style={[styles.badgeText, { color: statusConfig.textColor }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Metric Grid: Type, Date, Units */}
        <View style={styles.detailsGrid}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Donation Type</Text>
            <Text style={styles.gridValue} numberOfLines={1}>
              {donationTypeFormatted}
            </Text>
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Date</Text>
            <Text style={styles.gridValue} numberOfLines={1}>
              {formattedDate}
            </Text>
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Quantity</Text>
            <Text style={styles.gridValue} numberOfLines={1}>
              {units}
            </Text>
          </View>
        </View>

        {/* Blood Group Tag (if available) & Accordion Expand Button */}
        <View style={styles.footerRow}>
          {bloodGroup ? (
            <View style={styles.bloodTag}>
              <Ionicons name="water" size={11} color="#DC2626" />
              <Text style={styles.bloodTagText}>{bloodGroup}</Text>
            </View>
          ) : (
            <View />
          )}

          <TouchableOpacity
            onPress={() => setIsExpanded((prev) => !prev)}
            style={styles.expandTrigger}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.expandTriggerText}>
              {isExpanded ? 'Less info' : 'More info'}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="#64748B"
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Internal State Expandable Content (100% Isolated) */}
      {isExpanded && (
        <View style={styles.expandedSection}>
          <View style={styles.expandedDivider} />

          {/* Rejection Warning Banner if rejected */}
          {normalizedStatus === 'REJECTED' && donation.rejectionReason && (
            <View style={styles.rejectionNotice}>
              <Ionicons name="alert-circle" size={16} color="#B91C1C" style={{ marginRight: 6 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rejectionNoticeTitle}>Verification Feedback</Text>
                <Text style={styles.rejectionNoticeText}>
                  {donation.rejectionReason}
                </Text>
              </View>
            </View>
          )}

          {/* Notes if provided */}
          {Boolean(donation.notes) && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Donor Notes:</Text>
              <Text style={styles.notesContent}>{donation.notes}</Text>
            </View>
          )}

          {/* Certificate Action if Verified */}
          {normalizedStatus === 'VERIFIED' && (
            <View style={styles.verifiedRow}>
              <View style={styles.verifiedTextGroup}>
                <Ionicons name="shield-checkmark" size={16} color="#15803D" style={{ marginRight: 6 }} />
                <Text style={styles.verifiedMessage}>
                  {donation.certificateNumber
                    ? `Certificate #${donation.certificateNumber}`
                    : 'Official Life-Saving Donation Certificate'}
                </Text>
              </View>

              {onViewCertificate && (donation.certificateId || donation._id || donation.id) && (
                <TouchableOpacity
                  style={styles.certificateBtn}
                  activeOpacity={0.8}
                  onPress={() =>
                    onViewCertificate(
                      donation.certificateId || donation._id || donation.id || ''
                    )
                  }
                >
                  <Ionicons name="ribbon-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.certificateBtnText}>Certificate</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.recordMetaRow}>
            <Text style={styles.recordMetaText}>Donation ID: {id.slice(-8).toUpperCase()}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

// 2. Strictly Scoped Styling: 100% encapsulated within this file
const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    // Smooth cross-platform shadow
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  touchableArea: {
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  hospitalTextWrap: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  detailsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  gridItem: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  bloodTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bloodTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    marginLeft: 3,
  },
  expandTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  expandTriggerText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  expandedSection: {
    marginTop: 8,
  },
  expandedDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
  },
  rejectionNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  rejectionNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  rejectionNoticeText: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 16,
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 2,
  },
  notesContent: {
    fontSize: 12,
    color: '#334155',
  },
  verifiedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  verifiedTextGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  verifiedMessage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
    flex: 1,
  },
  certificateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803D',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  certificateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recordMetaRow: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
  recordMetaText: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'monospace',
  },
});
