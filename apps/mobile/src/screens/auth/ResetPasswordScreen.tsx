import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { AuthAPI } from '../../api/auth.api';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common';
import { colors, spacing } from '../../theme';

export const ResetPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email = route.params?.email || '';
  const userId = route.params?.userId || '';

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  const resetMutation = useMutation({
    mutationFn: (data: any) => AuthAPI.resetPassword(data),
    onSuccess: () => {
      Alert.alert(
        'Password Reset Successful! 🎉',
        'Your password has been updated. Please sign in with your new credentials.',
        [{ text: 'Sign In', onPress: () => navigation.navigate('Login') }]
      );
    },
    onError: (error: any) => {
      const msg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Failed to reset password. Please check your verification code.';
      setApiError(msg);
    },
  });

  const handleReset = () => {
    setApiError(null);
    const cleanCode = code.replace(/\D/g, '').trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setApiError('Please enter the 6-digit verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setApiError('New password must be at least 8 characters.');
      return;
    }
    const target = userId || email;
    if (!target) {
      setApiError('Session expired. Please request a new code.');
      return;
    }
    resetMutation.mutate({
      token: cleanCode,
      newPassword,
      userId: target,
      code: cleanCode,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-open-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.brandTitle}>Blood Sanjal</Text>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to your email along with your new password.
          </Text>
        </View>

        <View style={styles.card}>
          {apiError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{apiError}</Text>
            </View>
          )}

          <InputField
            label="6-Digit Reset Code"
            placeholder="• • • • • •"
            value={code}
            onChangeText={(val) => {
              setCode(val);
              if (apiError) setApiError(null);
            }}
            keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
            maxLength={6}
            autoCapitalize="none"
            leftIcon="shield-checkmark-outline"
          />

          <InputField
            label="New Password (min 8 characters)"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={(val) => {
              setNewPassword(val);
              if (apiError) setApiError(null);
            }}
            secureTextEntry
            leftIcon="lock-closed-outline"
          />

          <View style={{ marginTop: spacing.m }}>
            <PrimaryButton
              title="Reset Password & Sign In"
              icon="checkmark-done-circle-outline"
              onPress={handleReset}
              loading={resetMutation.isPending}
            />
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backButtonText}>Return to Sign In</Text>
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
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
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: spacing.s + 4,
    marginBottom: spacing.m,
    gap: 8,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});
