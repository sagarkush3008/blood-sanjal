import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { AuthAPI } from '../../api/auth.api';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');

  const forgotMutation = useMutation({
    mutationFn: (data: any) => AuthAPI.forgotPassword(data),
    onSuccess: (res: any) => {
      // The backend typically sends a code to the email, and possibly returns a reset token/userId depending on implementation
      Alert.alert('Success', 'If an account exists with this email, a reset code has been sent.', [
        { text: 'Enter Code', onPress: () => navigation.navigate('ResetPassword', { email }) }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to request password reset.');
    }
  });

  const handleForgot = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }
    forgotMutation.mutate({ email });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your registered email to receive a password reset code.</Text>

      <InputField
        label="Email Address"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={{ marginTop: spacing.m }}>
        <PrimaryButton 
          title="Send Reset Code" 
          onPress={handleForgot} 
          loading={forgotMutation.isPending}
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
