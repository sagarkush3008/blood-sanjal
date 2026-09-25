import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors, spacing } from '../../theme';

interface BloodGroupPickerProps {
  selectedValue: string;
  onValueChange: (val: string) => void;
}

export const BloodGroupPicker: React.FC<BloodGroupPickerProps> = ({ selectedValue, onValueChange }) => {
  return (
    <View style={styles.container}>
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        style={styles.picker}
      >
        <Picker.Item label="Any Blood Group" value="" color={colors.textMuted} />
        <Picker.Item label="A+" value="A+" color={colors.text} />
        <Picker.Item label="A-" value="A-" color={colors.text} />
        <Picker.Item label="B+" value="B+" color={colors.text} />
        <Picker.Item label="B-" value="B-" color={colors.text} />
        <Picker.Item label="AB+" value="AB+" color={colors.text} />
        <Picker.Item label="AB-" value="AB-" color={colors.text} />
        <Picker.Item label="O+" value="O+" color={colors.text} />
        <Picker.Item label="O-" value="O-" color={colors.text} />
      </Picker>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginBottom: spacing.m,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  }
});
