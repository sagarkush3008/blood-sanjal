import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { BloodRequestsAPI } from '../../api/requests.api';
import { InputField } from '../../components/forms/InputField';
import { BloodGroupPicker } from '../../components/forms/BloodGroupPicker';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';

const requestSchema = z.object({
  patientName: z.string().min(2, 'Patient name is required'),
  bloodGroup: z.string().min(1, 'Blood group is required'),
  unitsRequired: z.coerce.number().min(1, 'At least 1 unit is required'),
  hospitalName: z.string().min(3, 'Hospital name is required'),
  contactPhone: z.string().min(10, 'Valid contact number is required'),
});

type RequestFormData = z.infer<typeof requestSchema>;

export const CreateRequestScreen = () => {
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: { patientName: '', bloodGroup: '', unitsRequired: 1, hospitalName: '', contactPhone: '' }
  });

  const createMutation = useMutation({
    mutationFn: (data: RequestFormData) => BloodRequestsAPI.create({ ...data, urgency: 'NORMAL' }),
    onSuccess: () => {
      Alert.alert("Success", "Blood request posted successfully.");
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      navigation.goBack();
    },
    onError: (error: any) => {
      setApiError(error.response?.data?.message || 'Failed to create request.');
    }
  });

  const onSubmit = (data: RequestFormData) => {
    setApiError(null);
    createMutation.mutate(data);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Post a Blood Request</Text>
      <Text style={styles.subtitle}>Fill in the details for the patient in need.</Text>

      {apiError && <Text style={styles.apiError}>{apiError}</Text>}

      <Controller
        control={control}
        name="patientName"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField label="Patient Name" placeholder="Jane Doe" onBlur={onBlur} onChangeText={onChange} value={value} error={errors.patientName?.message} />
        )}
      />

      <Controller
        control={control}
        name="bloodGroup"
        render={({ field: { onChange, value } }) => (
          <View style={{ marginBottom: spacing.m }}>
            <Text style={styles.label}>Blood Group</Text>
            <BloodGroupPicker selectedValue={value} onValueChange={onChange} />
            {errors.bloodGroup?.message && <Text style={styles.errorText}>{errors.bloodGroup?.message}</Text>}
          </View>
        )}
      />

      <Controller
        control={control}
        name="unitsRequired"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField label="Units Required" placeholder="1" keyboardType="numeric" onBlur={onBlur} onChangeText={onChange} value={value.toString()} error={errors.unitsRequired?.message} />
        )}
      />

      <Controller
        control={control}
        name="hospitalName"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField label="Hospital & Location" placeholder="Bir Hospital, Kathmandu" onBlur={onBlur} onChangeText={onChange} value={value} error={errors.hospitalName?.message} />
        )}
      />

      <Controller
        control={control}
        name="contactPhone"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField label="Contact Phone" placeholder="98XXXXXXXX" keyboardType="phone-pad" onBlur={onBlur} onChangeText={onChange} value={value} error={errors.contactPhone?.message} />
        )}
      />

      <View style={styles.spacer} />

      <PrimaryButton
        title="Submit Request"
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
  },
  label: {
    ...typography.body2,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  errorText: {
    color: colors.danger,
    ...typography.caption,
    marginTop: -spacing.m + 4,
  }
});
