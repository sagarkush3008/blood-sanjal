import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { AuthAPI } from '../../api/auth.api';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';

export const VerifyEmailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [code, setCode] = useState('');
  
  // The userId should be passed from the RegisterScreen navigation params
  const userId = route.params?.userId;

  const verifyMutation = useMutation({
    mutationFn: (data: any) => AuthAPI.verifyEmail(data),
    onSuccess: () => {
      Alert.alert('Success', 'Email verified successfully! You can now log in.', [
        { text: 'Login', onPress: () => navigation.navigate('Login') }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Verification Failed', error.response?.data?.message || 'Invalid code.');
    }
  });

  const handleVerify = () => {
    if (!code) {
      Alert.alert('Error', 'Please enter the verification code.');
      return;
    }
    if (!userId) {
      Alert.alert('Error', 'Missing user ID. Please register again.');
      return;
    }
    verifyMutation.mutate({ userId, code, purpose: 'EMAIL_VERIFICATION' });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Verify Email</Text>
      <Text style={styles.subtitle}>Enter the 6-digit code sent to your email address.</Text>

      <InputField
        label="Verification Code"
        placeholder="Enter Code"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
      />

      <View style={{ marginTop: spacing.m }}>
        <PrimaryButton 
          title="Verify Email" 
          onPress={handleVerify} 
          loading={verifyMutation.isPending}
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
