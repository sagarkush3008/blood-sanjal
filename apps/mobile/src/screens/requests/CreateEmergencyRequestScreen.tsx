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
import { EmergencyRequestsAPI } from '../../api/requests.api';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { spacing } from '../../theme';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const emergencySchema = z.object({
  patientName: z.string().min(2, 'Patient name is required'),
  bloodGroup: z.string().min(1, 'Please choose a blood group'),
  hospitalName: z.string().min(3, 'Hospital and ward location is required'),
  contactPhone: z.string().min(10, 'Valid 10-digit emergency phone is required'),
  reason: z.string().min(5, 'Please provide the medical emergency reason'),
});

type EmergencyFormData = z.infer<typeof emergencySchema>;

export const CreateEmergencyRequestScreen = () => {
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmergencyFormData>({
    resolver: zodResolver(emergencySchema),
    defaultValues: {
      patientName: '',
      bloodGroup: 'O+',
      hospitalName: '',
      contactPhone: '',
      reason: '',
    },
  });

  const selectedBloodGroup = watch('bloodGroup');

  const createMutation = useMutation({
    mutationFn: (data: EmergencyFormData) =>
      EmergencyRequestsAPI.create(data),
    onSuccess: () => {
      Alert.alert(
        'Emergency Broadcast Dispatched! 🚨',
        'Your critical emergency request has been queued for immediate priority verification and push dispatch to all nearby compatible donors.',
        [
          {
            text: 'Understood',
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
        'Failed to submit emergency broadcast.';
      setApiError(message);
    },
  });

  const onSubmit = (data: EmergencyFormData) => {
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
        {/* Warning Alert Banner */}
        <View style={styles.criticalHeader}>
          <View style={styles.beaconDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.criticalTitle}>CRITICAL EMERGENCY BROADCAST</Text>
            <Text style={styles.criticalDesc}>
              Use this ONLY for life-threatening emergencies. This will trigger push alerts to registered donors nearby.
            </Text>
          </View>
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
                label="Patient Name"
                placeholder="Patient Full Name"
                leftIcon="person-outline"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.patientName?.message}
              />
            )}
          />

          {/* Blood Group Selector */}
          <View style={styles.bloodSelectContainer}>
            <Text style={styles.fieldLabel}>Blood Group Needed Urgently</Text>
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
            name="hospitalName"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Hospital, Ward & Bed Number"
                placeholder="e.g. Teaching Hospital, ICU Ward 2, Bed 14"
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
            name="reason"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Medical Emergency Reason"
                placeholder="e.g. Critical trauma surgery, acute hemorrhage"
                leftIcon="medical-outline"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.reason?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="contactPhone"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Emergency Direct Contact Phone"
                placeholder="98XXXXXXXX"
                keyboardType="phone-pad"
                leftIcon="call"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.contactPhone?.message}
              />
            )}
          />

          <View style={{ marginTop: spacing.m }}>
            <PrimaryButton
              title="Broadcast Emergency Alert"
              icon="alert-circle"
              variant="danger"
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
  criticalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF1F2',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    marginBottom: 18,
    gap: 12,
  },
  beaconDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#DC2626',
    marginTop: 3,
  },
  criticalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#991B1B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  criticalDesc: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 17,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
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

