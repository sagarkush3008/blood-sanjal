import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme';

interface BloodGroupChipProps {
  bloodGroup: string;
  selected?: boolean;
  onPress?: (group: string) => void;
  style?: ViewStyle;
}

export const BloodGroupChip: React.FC<BloodGroupChipProps> = ({
  bloodGroup,
  selected = false,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Blood group ${bloodGroup}${selected ? ' selected' : ''}`}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        style,
      ]}
      onPress={() => onPress && onPress(bloodGroup)}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>
        {bloodGroup}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
    minHeight: 44, // Touch target standard
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  text: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#334155',
  },
  textSelected: {
    color: colors.primary,
  },
});
