import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { AuthAPI } from '../../api/auth.api';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';

export const ResetPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email = route.params?.email || '';

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const resetMutation = useMutation({
    mutationFn: (data: any) => AuthAPI.resetPassword(data),
    onSuccess: () => {
      Alert.alert('Success', 'Password has been reset successfully. You can now log in.', [
        { text: 'Login', onPress: () => navigation.navigate('Login') }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Reset Failed', error.response?.data?.message || 'Invalid code or failed to reset password.');
    }
  });

  const handleReset = () => {
    if (!code || !newPassword) {
      Alert.alert('Error', 'Please enter both the reset code and a new password.');
      return;
    }
    resetMutation.mutate({ email, code, newPassword });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter the reset code sent to your email and your new password.</Text>

      <InputField
        label="Reset Code"
        placeholder="6-digit code"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
      />

      <InputField
        label="New Password"
        placeholder="Enter new password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />

      <View style={{ marginTop: spacing.m }}>
        <PrimaryButton 
          title="Reset Password" 
          onPress={handleReset} 
          loading={resetMutation.isPending}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h1,
    color: colors.primaryDark,
    marginTop: spacing.xxl,
    marginBottom: spacing.s,
  },
  subtitle: {
    ...typography.body1,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  }
});
