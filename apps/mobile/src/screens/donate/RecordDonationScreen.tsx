import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DonationsAPI } from '../../api/donations.api';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing } from '../../theme';

const DONATION_TYPES = [
  { label: 'Whole Blood', value: 'WHOLE_BLOOD' },
  { label: 'Platelets', value: 'PLATELETS' },
  { label: 'Plasma', value: 'PLASMA' },
];

const donationSchema = z.object({
  hospitalName: z.string().min(3, 'Hospital or donation center name is required'),
  donationDate: z
    .string()
    .min(10, 'Use YYYY-MM-DD format')
    .refine((val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d <= new Date();
    }, 'Donation date cannot be in the future'),
  donationType: z.string(),
  location: z.string().min(2, 'Location/City is required'),
  units: z.coerce.number().min(1, 'At least 1 unit'),
  notes: z.string().optional(),
});

type DonationFormData = z.infer<typeof donationSchema>;

export const RecordDonationScreen = () => {
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      hospitalName: '',
      donationDate: new Date().toISOString().split('T')[0],
      donationType: 'WHOLE_BLOOD',
      location: '',
      units: 1,
      notes: '',
    },
  });

  const selectedType = watch('donationType');

  const createMutation = useMutation({
    mutationFn: (data: DonationFormData) =>
      DonationsAPI.create({
        hospitalName: data.hospitalName,
        donationDate: data.donationDate,
        donationType: data.donationType,
        location: data.location,
        notes: data.notes ? `${data.units} Pint(s) - ${data.notes}` : `${data.units} Pint(s)`,
      }),
    onSuccess: () => {
      Alert.alert(
        'Donation Recorded! 🎖️',
        'Thank you for your life-saving contribution! Your donation certificate and hero points will be credited upon hospital verification.',
        [
          {
            text: 'View My Impact',
            onPress: () => {
              queryClient.invalidateQueries({ queryKey: ['my-donations'] });
              queryClient.invalidateQueries({ queryKey: ['donation-metrics'] });
              navigation.goBack();
            },
          },
        ]
      );
    },
    onError: (error: any) => {
      setApiError(
        error.response?.data?.error?.message ||
          error.response?.data?.message ||
          'Failed to record donation. Please check your donor profile.'
      );
    },
  });

  const onSubmit = (data: DonationFormData) => {
    setApiError(null);
    createMutation.mutate(data);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="heart-circle" size={34} color="#DC2626" />
          </View>
          <Text style={styles.title}>Record Blood Donation</Text>
          <Text style={styles.subtitle}>
            Log your blood donation to earn official verified certificates, hero badges, and track your health impact.
          </Text>
        </View>

        <View style={styles.card}>
          {apiError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorBannerText}>{apiError}</Text>
            </View>
          )}

          <Controller
            control={control}
            name="hospitalName"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Donation Hospital or Blood Bank *"
                placeholder="e.g. Teaching Hospital Blood Bank, Kathmandu"
                leftIcon="business-outline"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.hospitalName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="donationDate"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Donation Date (YYYY-MM-DD) *"
                placeholder="2026-10-25"
                leftIcon="calendar-outline"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.donationDate?.message}
              />
            )}
          />

          {/* Donation Type Selector */}
          <Text style={styles.fieldLabel}>Donation Type</Text>
          <View style={styles.typeSelectorRow}>
            {DONATION_TYPES.map((type) => {
              const isSelected = selectedType === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.typeChip, isSelected && styles.typeChipActive]}
                  onPress={() => setValue('donationType', type.value)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.typeChipText, isSelected && styles.typeChipTextActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Controller
            control={control}
            name="location"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="City / District *"
                placeholder="e.g. Kathmandu, Bagmati"
                leftIcon="location-outline"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.location?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="units"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Units / Pints Donated"
                placeholder="1"
                keyboardType="numeric"
                leftIcon="water-outline"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value?.toString()}
                error={errors.units?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Optional Remarks / Campaign Name"
                placeholder="e.g. Nepal Red Cross Youth Camp 2026"
                leftIcon="document-text-outline"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.notes?.message}
              />
            )}
          />

          <View style={{ marginTop: spacing.m }}>
            <PrimaryButton
              title="Submit Donation Record"
              icon="checkmark-circle"
              onPress={handleSubmit(onSubmit)}
              loading={createMutation.isPending}
            />
          </View>
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
    paddingTop: 16,
    paddingBottom: 36,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
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
    padding: 20,
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
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 4,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  typeChipActive: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.primary,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  typeChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});

