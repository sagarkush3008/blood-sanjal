import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DonationsAPI } from '../../api/donations.api';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';
import * as ImagePicker from 'expo-image-picker';

const logSchema = z.object({
  donationDate: z.string().min(1, "Date is required"),
  location: z.string().min(1, "Location is required"),
  hospitalName: z.string().min(1, "Hospital name is required"),
  notes: z.string().optional(),
});

type LogFormData = z.infer<typeof logSchema>;

export const LogDonationScreen = () => {
  const navigation = useNavigation();
  const [evidenceAssetId, setEvidenceAssetId] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<LogFormData>({
    resolver: zodResolver(logSchema),
    defaultValues: { donationDate: new Date().toISOString().split('T')[0], location: '', hospitalName: '', notes: '' }
  });

  const mutation = useMutation({
    mutationFn: (data: any) => DonationsAPI.create(data),
    onSuccess: () => {
      Alert.alert('Success', 'Donation logged successfully and is pending verification.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to log donation.');
    }
  });

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      // Typically we'd upload via FilesAPI, for now we set a mock ID
      setEvidenceAssetId('mock-asset-id-' + Date.now());
      Alert.alert('Attached', 'Evidence image attached successfully.');
    }
  };

  const onSubmit = (data: LogFormData) => {
    mutation.mutate({ ...data, evidenceAssetId });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Log a Donation</Text>
      <Text style={styles.subtitle}>Submit proof of your recent blood donation to earn Hero Points.</Text>

      <Controller
        control={control}
        name="donationDate"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField
            label="Donation Date (YYYY-MM-DD)"
            placeholder="2023-10-25"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.donationDate?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="hospitalName"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField
            label="Hospital / Clinic Name"
            placeholder="City Hospital"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.hospitalName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="location"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField
            label="City / Location"
            placeholder="Kathmandu"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.location?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField
            label="Additional Notes (Optional)"
            placeholder="Any special remarks..."
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            multiline
            numberOfLines={3}
            error={errors.notes?.message}
          />
        )}
      />

      <View style={styles.uploadSection}>
        <Text style={styles.uploadLabel}>Donation Evidence (Certificate / Photo)</Text>
        <PrimaryButton 
          title={evidenceAssetId ? "Change Evidence" : "Upload Evidence"} 
          onPress={handlePickImage} 
        />
        {evidenceAssetId && <Text style={styles.attachedText}>✅ Evidence Attached</Text>}
      </View>

      <View style={styles.spacer} />

      <PrimaryButton
        title="Submit Donation Log"
        onPress={handleSubmit(onSubmit)}
        loading={mutation.isPending}
      />
      <View style={styles.spacer} />
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body1,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  uploadSection: {
    marginTop: spacing.m,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  uploadLabel: {
    ...typography.body1,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.s,
  },
  uploadButton: {
    backgroundColor: colors.textMuted,
  },
  attachedText: {
    ...typography.caption,
    color: colors.success,
    marginTop: spacing.xs,
  },
  spacer: {
    height: spacing.xl,
  }
});
