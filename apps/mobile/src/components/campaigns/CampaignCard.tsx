import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface CampaignCardProps {
  title: string;
  organizer: string;
  date: string;
  location: string;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ title, organizer, date, location }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <Text style={styles.organizer}>{organizer}</Text>
      <View style={styles.footer}>
        <Text style={styles.meta}>{date}</Text>
        <Text style={styles.meta}>{location}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceSoft,
    padding: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  organizer: {
    ...typography.body2,
    color: colors.primary,
    marginBottom: spacing.m,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
  }
});
