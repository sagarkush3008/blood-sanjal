import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';

interface CampaignCardProps {
  title: string;
  organizer: string;
  date: string;
  location: string;
  participantsCount?: number;
  onPress?: () => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  title,
  organizer,
  date,
  location,
  participantsCount = 12,
  onPress,
}) => {
  // Extract month and day if possible, or fallback
  const dateObj = new Date(date);
  const isValidDate = !isNaN(dateObj.getTime());
  const dayStr = isValidDate ? dateObj.getDate().toString() : '15';
  const monthStr = isValidDate
    ? dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase()
    : 'OCT';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.topRow}>
        {/* Date Box */}
        <View style={styles.dateBadge}>
          <Text style={styles.dateDay}>{dayStr}</Text>
          <Text style={styles.dateMonth}>{monthStr}</Text>
        </View>

        {/* Info */}
        <View style={styles.infoCol}>
          <View style={styles.organizerRow}>
            <Ionicons name="medical" size={13} color="#DC2626" />
            <Text style={styles.organizerText} numberOfLines={1}>
              {organizer}
            </Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={14} color="#64748B" />
          <Text style={styles.metaText} numberOfLines={1}>
            {location}
          </Text>
        </View>

        <View style={styles.registeredPill}>
          <Ionicons name="people-outline" size={12} color="#047857" />
          <Text style={styles.registeredText}>
            {participantsCount} joined
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Text style={styles.viewDetailsText}>View Camp Details</Text>
        <Ionicons name="arrow-forward-circle" size={18} color="#DC2626" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateBadge: {
    width: 50,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '900',
    color: '#B91C1C',
    lineHeight: 22,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '800',
    color: '#991B1B',
    letterSpacing: 0.5,
  },
  infoCol: {
    flex: 1,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  organizerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    marginRight: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  registeredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 4,
  },
  registeredText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
});

