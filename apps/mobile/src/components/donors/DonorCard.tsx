import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface DonorCardProps {
  name: string;
  bloodGroup: string;
  location: string;
  status: string;
  onRequestContact: () => void;
}

export const DonorCard: React.FC<DonorCardProps> = ({ name, bloodGroup, location, status, onRequestContact }) => {
  return (
    <View style={styles.container}>
      <View style={styles.bloodBadge}>
        <Text style={styles.bloodText}>{bloodGroup}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.location} numberOfLines={1}>{location}</Text>
        <Text style={styles.status}>{status}</Text>
      </View>
      <TouchableOpacity style={styles.actionButton} onPress={onRequestContact}>
        <Text style={styles.actionText}>Request Contact</Text>
      </TouchableOpacity>
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
  name: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  location: {
    ...typography.body2,
    color: colors.textMuted,
    marginBottom: 4,
  },
  status: {
    ...typography.caption,
    color: colors.success,
    backgroundColor: '#E6F4EA',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  actionButton: {
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: 8,
  },
  actionText: {
    color: colors.primaryDark,
    ...typography.button,
    fontSize: 12,
  }
});
