import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string;
  leftIcon?: string | React.ReactNode;
}

export const InputField = forwardRef<TextInput, InputFieldProps>(
  ({ label, error, leftIcon, style, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const internalInputRef = useRef<TextInput>(null);

    useImperativeHandle(ref, () => internalInputRef.current as TextInput);

    const handleContainerPress = () => {
      if (internalInputRef.current) {
        internalInputRef.current.focus();
      }
    };

    const renderIcon = () => {
      if (!leftIcon) return null;
      return (
        <View pointerEvents="none" style={styles.iconWrapper}>
          {typeof leftIcon === 'string' ? (
            <Ionicons
              name={leftIcon as any}
              size={18}
              color={isFocused ? colors.primary : '#64748B'}
            />
          ) : (
            leftIcon
          )}
        </View>
      );
    };

    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleContainerPress}
          style={[
            styles.inputContainer,
            isFocused && styles.inputFocused,
            Boolean(error) && styles.inputError,
          ]}
        >
          {renderIcon()}
          <TextInput
            ref={internalInputRef}
            style={[styles.input, style]}
            placeholderTextColor="#94A3B8"
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />
        </TouchableOpacity>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }
);

InputField.displayName = 'InputField';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    minHeight: 52,
  },
  iconWrapper: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    minHeight: 48,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

