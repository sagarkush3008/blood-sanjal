import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { EmergencyRequestsAPI } from '../../api/requests.api';
import { InputField } from '../../components/forms/InputField';
import { BloodGroupPicker } from '../../components/forms/BloodGroupPicker';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';

const emergencySchema = z.object({
  patientName: z.string().min(2, 'Patient name is required'),
  bloodGroup: z.string().min(1, 'Blood group is required'),
  hospitalName: z.string().min(3, 'Hospital name is required'),
  contactPhone: z.string().min(10, 'Valid contact number is required'),
  reason: z.string().min(5, 'Please provide the medical reason'),
});

type EmergencyFormData = z.infer<typeof emergencySchema>;

export const CreateEmergencyRequestScreen = () => {
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<EmergencyFormData>({
    resolver: zodResolver(emergencySchema),
    defaultValues: { patientName: '', bloodGroup: '', hospitalName: '', contactPhone: '', reason: '' }
  });

  const createMutation = useMutation({
    mutationFn: (data: EmergencyFormData) => EmergencyRequestsAPI.create(data),
    onSuccess: () => {
      Alert.alert(
        "Emergency Broadcast Pending",
        "Your request has been submitted to admins for verification. Once verified, it will be broadcasted to all compatible donors nearby.",
        [{ text: "Understood", onPress: () => {
          queryClient.invalidateQueries({ queryKey: ['my-requests'] });
          navigation.goBack();
        }}]
      );
    },
    onError: (error: any) => {
      setApiError(error.response?.data?.message || 'Failed to submit emergency broadcast.');
    }
  });

  const onSubmit = (data: EmergencyFormData) => {
    setApiError(null);
    createMutation.mutate(data);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>CRITICAL BROADCAST</Text>
        <Text style={styles.warningText}>
          Use this ONLY for life-threatening emergencies. Admin approval is required. Misuse may result in an account ban.
        </Text>
      </View>

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
            <Text style={styles.label}>Blood Group Needed</Text>
            <BloodGroupPicker selectedValue={value} onValueChange={onChange} />
            {errors.bloodGroup?.message && <Text style={styles.errorText}>{errors.bloodGroup?.message}</Text>}
          </View>
        )}
      />

      <Controller
        control={control}
        name="hospitalName"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField label="Hospital & Exact Ward" placeholder="ICU, Teaching Hospital" onBlur={onBlur} onChangeText={onChange} value={value} error={errors.hospitalName?.message} />
        )}
      />

      <Controller
        control={control}
        name="reason"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField label="Medical Reason" placeholder="Open Heart Surgery" onBlur={onBlur} onChangeText={onChange} value={value} error={errors.reason?.message} />
        )}
      />

      <Controller
        control={control}
        name="contactPhone"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField label="Emergency Contact Phone" placeholder="98XXXXXXXX" keyboardType="phone-pad" onBlur={onBlur} onChangeText={onChange} value={value} error={errors.contactPhone?.message} />
        )}
      />

      <View style={styles.spacer} />

      <View style={{ opacity: createMutation.isPending ? 0.5 : 1 }}>
        <PrimaryButton
          title="Submit Emergency Request"
          onPress={handleSubmit(onSubmit)}
          loading={createMutation.isPending}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.l,
  },
  warningBox: {
    backgroundColor: '#FEE2E2',
    borderColor: colors.danger,
    borderWidth: 1,
    padding: spacing.m,
    borderRadius: 8,
    marginBottom: spacing.l,
  },
  warningTitle: {
    ...typography.h3,
    color: colors.danger,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  warningText: {
    ...typography.caption,
    color: '#991B1B',
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
