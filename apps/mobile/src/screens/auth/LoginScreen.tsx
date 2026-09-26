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
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';
import { useNavigation } from '@react-navigation/native';

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
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
    mutationFn: (data: LoginFormData) => AuthAPI.login(data),
    onSuccess: (response) => {
      const { accessToken, refreshToken, user } =
        response.data?.data || response.data || {};
      if (accessToken) {
        setAuth(accessToken, user, refreshToken);
      } else {
        setApiError('Login failed: Token missing from response');
      }
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Invalid email or password. Please verify credentials.';
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
          {/* BloodLink Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.logoRow}>
              <View style={styles.logoBadge}>
                <Ionicons name="water" size={30} color="#DC2626" />
              </View>
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.brandTitle}>Blood</Text>
                  <Text style={[styles.brandTitle, { color: '#DC2626' }]}>Link</Text>
                </View>
                <Text style={styles.brandTagline}>NATIONAL BLOOD NETWORK</Text>
              </View>
            </View>

            <View style={styles.accreditPill}>
              <Ionicons name="shield-checkmark" size={14} color="#059669" />
              <Text style={styles.accreditText}>Certified Safe Medical Portal</Text>
            </View>
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtitle}>
              Sign in to manage blood requests, connect with donors, and save lives.
            </Text>

            {apiError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorBannerText}>{apiError}</Text>
              </View>
            )}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputField
                  label="Email Address"
                  placeholder="name@example.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  leftIcon="mail-outline"
                  onBlur={onBlur}
                  onChangeText={onChange}
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
                  secureTextEntry
                  leftIcon="lock-closed-outline"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />

            <View style={styles.optionsRow}>
              <TouchableOpacity
                onPress={fillAdmin}
                style={styles.demoPill}
              >
                <Ionicons name="key-outline" size={14} color="#DC2626" />
                <Text style={styles.demoPillText}>Demo Admin Fill</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: spacing.m }}>
              <PrimaryButton
                title="Sign In to BloodLink"
                icon="arrow-forward"
                onPress={handleSubmit(onSubmit)}
                loading={loginMutation.isPending}
              />
            </View>

            {/* Quick Register CTA */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Ionicons name="person-add-outline" size={18} color="#0F172A" />
              <Text style={styles.registerButtonText}>Create New Account</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Security Badges */}
          <View style={styles.securityFooter}>
            <View style={styles.badgeItem}>
              <Ionicons name="lock-closed" size={14} color="#64748B" />
              <Text style={styles.badgeLabel}>256-bit Encryption</Text>
            </View>
            <View style={styles.badgeDot} />
            <View style={styles.badgeItem}>
              <Ionicons name="checkmark-done-circle" size={14} color="#64748B" />
              <Text style={styles.badgeLabel}>WHO Certified</Text>
            </View>
            <View style={styles.badgeDot} />
            <View style={styles.badgeItem}>
              <Ionicons name="medkit" size={14} color="#64748B" />
              <Text style={styles.badgeLabel}>Emergency Ready</Text>
            </View>
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    justifyContent: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  accreditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    marginTop: 6,
  },
  accreditText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 12,
    gap: 6,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  dividerText: {
    paddingHorizontal: 10,
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  registerButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  badgeDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
});

