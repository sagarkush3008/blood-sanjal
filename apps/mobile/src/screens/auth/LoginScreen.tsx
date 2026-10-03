import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { AuthAPI } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common';
import { colors, spacing } from '../../theme';
import { useNavigation } from '@react-navigation/native';

const loginSchema = z.object({
  email: z.string().min(3, 'Email or phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginScreen = () => {
  const { setAuth } = useAuthStore();
  const navigation = useNavigation<any>();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => {
      const isEmail = data.email.includes('@');
      const payload = isEmail
        ? { email: data.email.trim(), password: data.password }
        : { phone: data.email.trim(), password: data.password };
      return AuthAPI.login(payload);
    },
    onSuccess: async (response) => {
      const data = response.data?.data || response.data || {};
      const { accessToken, refreshToken, user } = data;
      if (accessToken) {
        await setAuth(accessToken, user, refreshToken);
      } else {
        setApiError('Authentication failed: Missing token in response.');
      }
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Invalid credentials. Please verify your email/phone and password.';
      setApiError(message);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setApiError(null);
    loginMutation.mutate(data);
  };

  const fillAdmin = () => {
    setValue('email', 'admin@bloodsanjal.org');
    setValue('password', 'Password123!');
    setApiError(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Ionicons name="water" size={32} color={colors.primary} />
            </View>
            <Text style={styles.brandTitle}>Blood Sanjal</Text>
            <Text style={styles.brandTagline}>Connecting People. Saving Lives.</Text>
            <Text style={styles.subtitle}>
              Sign in to manage blood requests, donor connections, and emergency alerts.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {apiError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color={colors.danger} />
                <Text style={styles.errorBannerText}>{apiError}</Text>
              </View>
            )}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputField
                  label="Email or Phone Number"
                  placeholder="admin@bloodsanjal.org or 98XXXXXXXX"
                  autoCapitalize="none"
                  leftIcon="mail-outline"
                  onBlur={onBlur}
                  onChangeText={(val) => {
                    onChange(val);
                    if (apiError) setApiError(null);
                  }}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputField
                  label="Password"
                  placeholder="Enter your password"
                  isPassword
                  leftIcon="lock-closed-outline"
                  onBlur={onBlur}
                  onChangeText={(val) => {
                    onChange(val);
                    if (apiError) setApiError(null);
                  }}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />

            <View style={styles.forgotRow}>
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: spacing.s }}>
              <PrimaryButton
                title="Sign In"
                icon="log-in-outline"
                onPress={handleSubmit(onSubmit)}
                loading={loginMutation.isPending}
              />
            </View>

            {/* Demo Quick Fill for Ease of Testing */}
            <View style={styles.demoSection}>
              <Text style={styles.demoLabel}>Demo Quick Credentials</Text>
              <TouchableOpacity style={styles.demoButton} onPress={fillAdmin}>
                <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
                <Text style={styles.demoButtonText}>Auto-fill Admin (admin@bloodsanjal.org)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>New to Blood Sanjal? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Create an Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: spacing.l,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.l,
    marginTop: spacing.m,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  brandTitle: {
    fontSize: 26,
    fontFamily: 'Inter_800ExtraBold',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  brandTagline: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: spacing.l,
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
    padding: spacing.m,
    marginBottom: spacing.m,
    gap: 8,
  },
  errorBannerText: {
    color: '#991B1B',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.m,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
  },
  demoSection: {
    marginTop: spacing.l,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
  },
  demoLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  demoButtonText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  footerLink: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
  },
});
