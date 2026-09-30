import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string;
  leftIcon?: string | React.ReactNode;
  isPassword?: boolean;
}

export const InputField = forwardRef<TextInput, InputFieldProps>(
  ({ label, error, leftIcon, isPassword, style, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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
            secureTextEntry={isPassword ? !isPasswordVisible : props.secureTextEntry}
            {...props}
          />
          {isPassword && (
            <TouchableOpacity
              style={styles.rightIconWrapper}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              <Ionicons
                name={isPasswordVisible ? 'eye-off' : 'eye'}
                size={20}
                color="#64748B"
              />
            </TouchableOpacity>
          )}
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
    fontWeight: '600',
    color: '#334155',
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    minHeight: 46,
  },
  iconWrapper: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconWrapper: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  input: {
    flex: 1,
    height: '100%',
    minHeight: 44,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '400',
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});

