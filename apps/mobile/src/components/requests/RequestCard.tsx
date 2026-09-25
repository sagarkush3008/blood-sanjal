import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface RequestCardProps {
  bloodGroup: string;
  location: string;
  urgency: 'NORMAL' | 'HIGH' | 'EMERGENCY';
  status: string;
}

export const RequestCard: React.FC<RequestCardProps> = ({ bloodGroup, location, urgency, status }) => {
  return (
    <View style={styles.container}>
      <View style={styles.bloodBadge}>
        <Text style={styles.bloodText}>{bloodGroup}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.location} numberOfLines={1}>{location}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.urgency, urgency === 'EMERGENCY' && styles.emergency]}>{urgency}</Text>
          <Text style={styles.status}>{status}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bloodBadge: {
    backgroundColor: colors.primary,
    height: 50,
    width: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  bloodText: {
    color: colors.surface,
    ...typography.h3,
  },
  content: {
    flex: 1,
  },
  location: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgency: {
    ...typography.caption,
    color: colors.textMuted,
    marginRight: spacing.m,
  },
  emergency: {
    color: colors.danger,
    fontWeight: 'bold',
  },
  status: {
    ...typography.caption,
    color: colors.primaryDark,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.s,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  }
});
