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
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton, BloodGroupChip } from '../../components/common';
import { colors, spacing } from '../../theme';
import { useNavigation } from '@react-navigation/native';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const registerSchema = z.object({
  name: z.string().min(2, 'Full name is required (min 2 characters)'),
  email: z.string().email('Valid email address is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  bloodGroup: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('O+');

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      bloodGroup: 'O+',
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormData) => AuthAPI.register(data),
    onSuccess: (response: any) => {
      const data = response?.data?.data || response?.data;
      const userId = data?.userId || data?.user?.id || data?._id;
      if (userId) {
        navigation.navigate('VerifyEmail', {
          userId,
          email: control._formValues.email,
          phone: control._formValues.phone,
        });
      } else {
        navigation.navigate('Login');
      }
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Registration failed. Please check your details and try again.';
      setApiError(message);
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    setApiError(null);
    registerMutation.mutate({
      ...data,
      bloodGroup: selectedBloodGroup,
    });
  };

  const handleSelectBloodGroup = (bg: string) => {
    setSelectedBloodGroup(bg);
    setValue('bloodGroup', bg);
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
              <Ionicons name="water" size={30} color={colors.primary} />
            </View>
            <Text style={styles.brandTitle}>Blood Sanjal</Text>
            <Text style={styles.brandTagline}>Connecting People. Saving Lives.</Text>
            <Text style={styles.subtitle}>
              Register as a donor or community member to request or donate blood.
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
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputField
                  label="Full Name"
                  placeholder="e.g. Aarav Sharma"
                  leftIcon="person-outline"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputField
                  label="Email Address"
                  placeholder="aarav@example.com"
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
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputField
                  label="Phone Number"
                  placeholder="98XXXXXXXX"
                  keyboardType="phone-pad"
                  leftIcon="call-outline"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.phone?.message}
                />
              )}
            />

            {/* Blood Group Selector */}
            <View style={styles.bloodGroupSection}>
              <Text style={styles.fieldLabel}>Blood Group</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bloodChipsRow}
              >
                {BLOOD_GROUPS.map((bg) => (
                  <BloodGroupChip
                    key={bg}
                    bloodGroup={bg}
                    selected={selectedBloodGroup === bg}
                    onPress={handleSelectBloodGroup}
                    style={styles.chipMargin}
                  />
                ))}
              </ScrollView>
            </View>

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputField
                  label="Password (min 8 characters)"
                  placeholder="Create a secure password"
                  isPassword
                  leftIcon="lock-closed-outline"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />

            <View style={{ marginTop: spacing.m }}>
              <PrimaryButton
                title="Create Account"
                icon="checkmark-circle-outline"
                onPress={handleSubmit(onSubmit)}
                loading={registerMutation.isPending}
              />
            </View>

            <View style={styles.termsBox}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.textMuted} />
              <Text style={styles.termsText}>
                Your contact details are encrypted and will never be shared without explicit consent.
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already registered? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
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
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  brandTagline: {
    fontSize: 13,
    fontWeight: '600',
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
    paddingHorizontal: 20,
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
    fontWeight: '500',
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  bloodGroupSection: {
    marginBottom: spacing.m,
  },
  bloodChipsRow: {
    paddingVertical: 4,
  },
  chipMargin: {
    marginRight: 8,
  },
  termsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.m,
    padding: spacing.s,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  termsText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
    lineHeight: 15,
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
    fontWeight: '700',
    color: colors.primary,
  },
});
