import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge } from '../common/StatusBadge';
import { BloodGroupChip } from '../common/BloodGroupChip';
import { colors, spacing } from '../../theme';

interface CampaignCardProps {
  campaign: {
    _id: string;
    title: string;
    organizer: string;
    location: string;
    date: string | Date;
    startTime: string;
    endTime: string;
    description?: string;
    bloodGroupsNeeded?: string[];
    status?: string;
    participantsCount?: number;
  };
  isRegistered?: boolean;
  onPress: () => void;
  onRsvpToggle?: () => void;
  isRsvpLoading?: boolean;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  isRegistered,
  onPress,
  onRsvpToggle,
  isRsvpLoading,
}) => {
  const campaignDate = new Date(campaign.date);
  const monthName = campaignDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const dayNum = campaignDate.getDate();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.topRow}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateMonth}>{monthName}</Text>
          <Text style={styles.dateDay}>{dayNum}</Text>
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.badgeRow}>
            <StatusBadge status={campaign.status || 'PUBLISHED'} />
            {isRegistered && (
              <View style={styles.registeredPill}>
                <Ionicons name="checkmark-circle" size={12} color="#059669" />
                <Text style={styles.registeredText}>RSVP'd</Text>
              </View>
            )}
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {campaign.title}
          </Text>
          <Text style={styles.organizer} numberOfLines={1}>
            by {campaign.organizer}
          </Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={14} color="#64748B" />
          <Text style={styles.detailText} numberOfLines={1}>
            {campaign.location}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={14} color="#64748B" />
          <Text style={styles.detailText}>
            {campaign.startTime} - {campaign.endTime}
          </Text>
        </View>
      </View>

      {campaign.bloodGroupsNeeded && campaign.bloodGroupsNeeded.length > 0 && (
        <View style={styles.groupsRow}>
          <Text style={styles.groupsLabel}>Needed:</Text>
          <View style={styles.groupsList}>
            {campaign.bloodGroupsNeeded.slice(0, 4).map((bg) => (
              <BloodGroupChip key={bg} bloodGroup={bg} />
            ))}
            {campaign.bloodGroupsNeeded.length > 4 && (
              <Text style={styles.moreGroupsText}>
                +{campaign.bloodGroupsNeeded.length - 4} more
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.rsvpBtn, isRegistered && styles.rsvpBtnActive]}
          onPress={onRsvpToggle}
          disabled={isRsvpLoading}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isRegistered ? 'checkmark-circle' : 'add-circle-outline'}
            size={16}
            color={isRegistered ? '#059669' : colors.primary}
          />
          <Text
            style={[
              styles.rsvpBtnText,
              isRegistered && styles.rsvpBtnTextActive,
            ]}
          >
            {isRsvpLoading ? 'Updating...' : isRegistered ? 'Attending' : 'RSVP to Donate'}
          </Text>
        </TouchableOpacity>

        <View style={styles.viewMoreRow}>
          <Text style={styles.viewMoreText}>Details</Text>
          <Ionicons name="chevron-forward" size={14} color="#64748B" />
        </View>
      </View>
    </TouchableOpacity>
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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dateBadge: {
    width: 48,
    height: 52,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dateMonth: {
    fontSize: 10,
    fontFamily: 'Inter_800ExtraBold',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  dateDay: {
    fontSize: 18,
    fontFamily: 'Inter_900Black',
    color: '#0F172A',
    lineHeight: 22,
  },
  headerInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  registeredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  registeredText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#059669',
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
    lineHeight: 20,
  },
  organizer: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '55%',
  },
  detailText: {
    fontSize: 11,
    color: '#475569',
    fontFamily: 'Inter_500Medium',
  },
  groupsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  groupsLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#64748B',
  },
  groupsList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moreGroupsText: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'Inter_500Medium',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 12,
  },
  rsvpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rsvpBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  rsvpBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
  },
  rsvpBtnTextActive: {
    color: '#059669',
  },
  viewMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewMoreText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#64748B',
  },
});
