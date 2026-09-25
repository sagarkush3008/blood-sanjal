import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { DonationsAPI } from '../../api/donations.api';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';

const donationSchema = z.object({
  hospitalName: z.string().min(3, 'Hospital or Location name is required'),
  donationDate: z.string().min(10, 'Use YYYY-MM-DD format for now'),
  units: z.coerce.number().min(1, 'At least 1 unit'),
});

type DonationFormData = z.infer<typeof donationSchema>;

export const RecordDonationScreen = () => {
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    defaultValues: { hospitalName: '', donationDate: new Date().toISOString().split('T')[0], units: 1 }
  });

  const createMutation = useMutation({
    mutationFn: (data: DonationFormData) => DonationsAPI.create({ ...data, donationType: 'WHOLE_BLOOD' }),
    onSuccess: () => {
      Alert.alert("Recorded!", "Your donation has been recorded and is pending verification.");
      queryClient.invalidateQueries({ queryKey: ['my-donations'] });
      navigation.goBack();
    },
    onError: (error: any) => {
      setApiError(error.response?.data?.message || 'Failed to record donation.');
    }
  });

  const onSubmit = (data: DonationFormData) => {
    setApiError(null);
    createMutation.mutate(data);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Track Your Donation</Text>
      <Text style={styles.subtitle}>Help us verify your life-saving contribution.</Text>

      {apiError && <Text style={styles.apiError}>{apiError}</Text>}

      <Controller
        control={control}
        name="hospitalName"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField label="Donation Location / Hospital" placeholder="Teaching Hospital, Ward 5" onBlur={onBlur} onChangeText={onChange} value={value} error={errors.hospitalName?.message} />
        )}
      />

      <Controller
        control={control}
        name="donationDate"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField label="Date (YYYY-MM-DD)" placeholder="2026-10-25" onBlur={onBlur} onChangeText={onChange} value={value} error={errors.donationDate?.message} />
        )}
      />

      <Controller
        control={control}
        name="units"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField label="Units Donated" placeholder="1" keyboardType="numeric" onBlur={onBlur} onChangeText={onChange} value={value.toString()} error={errors.units?.message} />
        )}
      />

      <View style={styles.spacer} />

      <PrimaryButton
        title="Submit Record"
        onPress={handleSubmit(onSubmit)}
        loading={createMutation.isPending}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.l,
  },
  title: {
    ...typography.h2,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body1,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  apiError: {
    color: colors.danger,
    marginBottom: spacing.m,
    ...typography.body2,
    textAlign: 'center',
  },
  spacer: {
    height: spacing.m,
  }
});
