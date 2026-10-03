import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'danger' | 'secondary';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string | React.ReactNode;
  accessibilityLabel?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style,
  textStyle,
  icon,
  accessibilityLabel,
}) => {
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';
  const isSecondary = variant === 'secondary';

  const iconColor = isOutline
    ? colors.primary
    : isSecondary
    ? colors.primary
    : '#FFFFFF';

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return (
        <Ionicons
          name={icon as any}
          size={18}
          color={iconColor}
          style={{ marginRight: 8 }}
        />
      );
    }
    if (React.isValidElement(icon)) {
      return icon;
    }
    return null;
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: !!(disabled || loading) }}
      style={[
        styles.button,
        isOutline && styles.buttonOutline,
        isDanger && styles.buttonDanger,
        isSecondary && styles.buttonSecondary,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isOutline ? colors.primary : '#FFFFFF'}
        />
      ) : (
        <>
          {renderIcon()}
          <Text
            style={[
              styles.text,
              isOutline && styles.textOutline,
              isSecondary && styles.textSecondary,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    minHeight: 48, // Accessibility standard ≥44px
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
    shadowColor: colors.danger,
  },
  buttonSecondary: {
    backgroundColor: '#F1F5F9',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.1,
  },
  textOutline: {
    color: '#0F172A',
  },
  textSecondary: {
    color: '#334155',
  },
});
