import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BloodRequestsAPI } from '../../api/requests.api';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing } from '../../theme';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const requestSchema = z.object({
  patientName: z.string().min(2, 'Patient name is required'),
  bloodGroup: z.string().min(1, 'Please select a blood group'),
  unitsRequired: z.coerce.number().min(1, 'At least 1 unit is required'),
  hospitalName: z.string().min(3, 'Hospital and ward location is required'),
  contactPhone: z.string().min(10, 'Valid 10-digit contact number is required'),
});

type RequestFormData = z.infer<typeof requestSchema>;

export const CreateRequestScreen = () => {
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      patientName: '',
      bloodGroup: 'O+',
      unitsRequired: 1,
      hospitalName: '',
      contactPhone: '',
    },
  });

  const selectedBloodGroup = watch('bloodGroup');

  const createMutation = useMutation({
    mutationFn: (data: RequestFormData) =>
      BloodRequestsAPI.create({ ...data, urgency: 'NORMAL' }),
    onSuccess: () => {
      Alert.alert(
        'Request Published! 🩸',
        'Your blood request has been listed on the live network. Compatible donors nearby will be notified.',
        [
          {
            text: 'View Requests',
            onPress: () => {
              queryClient.invalidateQueries({ queryKey: ['my-requests'] });
              queryClient.invalidateQueries({ queryKey: ['blood-requests'] });
              navigation.goBack();
            },
          },
        ]
      );
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'Failed to create request.';
      setApiError(message);
    },
  });

  const onSubmit = (data: RequestFormData) => {
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
            <Ionicons name="add-circle" size={32} color="#DC2626" />
          </View>
          <Text style={styles.title}>Post a Blood Request</Text>
          <Text style={styles.subtitle}>
            Broadcast to active blood donors and healthcare partners across the network.
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
            name="patientName"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Patient Full Name"
                placeholder="e.g. Ramesh Thapa"
                leftIcon="person-outline"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.patientName?.message}
              />
            )}
          />

          {/* Blood Group Quick Selector */}
          <View style={styles.bloodSelectContainer}>
            <Text style={styles.fieldLabel}>Blood Group Needed</Text>
            <View style={styles.bloodGrid}>
              {BLOOD_GROUPS.map((bg) => {
                const isSelected = selectedBloodGroup === bg;
                return (
                  <TouchableOpacity
                    key={bg}
                    activeOpacity={0.8}
                    style={[
                      styles.bloodPill,
                      isSelected && styles.bloodPillActive,
                    ]}
                    onPress={() => setValue('bloodGroup', bg)}
                  >
                    <Ionicons
                      name="water"
                      size={14}
                      color={isSelected ? '#FFFFFF' : '#DC2626'}
                    />
                    <Text
                      style={[
                        styles.bloodPillText,
                        isSelected && styles.bloodPillTextActive,
                      ]}
                    >
                      {bg}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.bloodGroup?.message && (
              <Text style={styles.errorText}>
                {errors.bloodGroup?.message}
              </Text>
            )}
          </View>

          <Controller
            control={control}
            name="unitsRequired"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Units / Pints Required"
                placeholder="1"
                keyboardType="numeric"
                leftIcon="medkit-outline"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value?.toString()}
                error={errors.unitsRequired?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="hospitalName"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Hospital & Exact Location"
                placeholder="e.g. Bir Hospital, ICU Ward 3B, Kathmandu"
                leftIcon="location-outline"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.hospitalName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="contactPhone"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Direct Contact Phone"
                placeholder="98XXXXXXXX"
                keyboardType="phone-pad"
                leftIcon="call-outline"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.contactPhone?.message}
              />
            )}
          />

          <View style={{ marginTop: spacing.m }}>
            <PrimaryButton
              title="Publish Blood Request"
              icon="send"
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
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
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
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
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
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  bloodSelectContainer: {
    marginBottom: 16,
  },
  bloodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
    minWidth: 68,
    justifyContent: 'center',
  },
  bloodPillActive: {
    backgroundColor: '#DC2626',
    borderColor: '#B91C1C',
  },
  bloodPillText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991B1B',
  },
  bloodPillTextActive: {
    color: '#FFFFFF',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

