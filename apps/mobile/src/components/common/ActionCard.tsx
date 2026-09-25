import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface ActionCardProps {
  title: string;
  subtitle: string;
  onPress: () => void;
  isEmergency?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({ title, subtitle, onPress, isEmergency }) => {
  return (
    <TouchableOpacity
      style={[styles.container, isEmergency && styles.emergencyContainer]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View>
        <Text style={[styles.title, isEmergency && styles.emergencyText]}>{title}</Text>
        <Text style={[styles.subtitle, isEmergency && styles.emergencyText]}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primaryLight,
    padding: spacing.l,
    borderRadius: 16,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emergencyContainer: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  title: {
    ...typography.h3,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body2,
    color: colors.textMuted,
  },
  emergencyText: {
    color: colors.surface,
  }
});
