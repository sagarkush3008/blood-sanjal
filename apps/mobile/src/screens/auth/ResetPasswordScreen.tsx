import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { AuthAPI } from '../../api/auth.api';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { spacing } from '../../theme';

export const ResetPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email = route.params?.email || '';
  const userId = route.params?.userId || '';

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const resetMutation = useMutation({
    mutationFn: (data: any) => AuthAPI.resetPassword(data),
    onSuccess: () => {
      Alert.alert('Password Changed! 🎉', 'Your password has been successfully updated. You can now log in with your new password.', [
        { text: 'Log In Now', onPress: () => navigation.navigate('Login') }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Reset Failed', error.response?.data?.error?.message || error.response?.data?.message || 'Invalid code or failed to reset password.');
    }
  });

  const handleReset = () => {
    const cleanCode = code.replace(/\D/g, '').trim();
    if (!cleanCode || !newPassword) {
      Alert.alert('Incomplete Form', 'Please enter both the reset code and your new password.');
      return;
    }
    if (cleanCode.length !== 6) {
      Alert.alert('Incomplete Code', 'Please enter the full 6-digit verification code.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }
    const target = userId || email;
    if (!target) {
      Alert.alert('Session Expired', 'Please request a password reset code again from the Forgot Password screen.');
      return;
    }
    resetMutation.mutate({ userId: target, email, code: cleanCode, newPassword });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed-outline" size={32} color="#DC2626" />
          </View>
          <Text style={styles.title}>Create New Password</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit verification code sent to your email and set your new account password.
          </Text>
        </View>

        <View style={styles.card}>
          <InputField
            label="6-Digit Reset Code"
            placeholder="e.g. 123456"
            value={code}
            onChangeText={setCode}
            keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
            maxLength={6}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            leftIcon="shield-checkmark-outline"
          />

          <InputField
            label="New Password"
            placeholder="Min 8 characters"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            textContentType="newPassword"
            leftIcon="lock-closed-outline"
          />

          <View style={{ marginTop: spacing.m }}>
            <PrimaryButton 
              title="Save New Password" 
              icon="checkmark-circle-outline"
              onPress={handleReset} 
              loading={resetMutation.isPending}
            />
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backButtonText}>Cancel & Go to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
});

