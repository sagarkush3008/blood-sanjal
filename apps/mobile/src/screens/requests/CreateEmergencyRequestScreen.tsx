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
import { PrimaryButton, BloodGroupChip } from '../../components/common';
import { colors, spacing } from '../../theme';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const emergencySchema = z.object({
  patientName: z.string().min(2, 'Patient name is required'),
  bloodGroup: z.string().min(1, 'Please select a blood group'),
  unitsRequired: z.coerce.number().min(1, 'At least 1 unit').max(10, 'Max 10 units'),
  hospitalName: z.string().min(3, 'Hospital, ICU or trauma ward is required'),
  contactPhone: z.string().min(10, 'Valid 10-digit emergency contact phone is required'),
  reason: z.string().min(5, 'Clinical emergency diagnosis / reason is required'),
});

type EmergencyFormData = z.infer<typeof emergencySchema>;

export const CreateEmergencyRequestScreen = () => {
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('O+');

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EmergencyFormData>({
    resolver: zodResolver(emergencySchema),
    defaultValues: {
      patientName: '',
      bloodGroup: 'O+',
      unitsRequired: 2,
      hospitalName: '',
      contactPhone: '',
      reason: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: EmergencyFormData) =>
      EmergencyRequestsAPI.create({
        ...data,
        bloodGroup: selectedBloodGroup,
        urgency: 'EMERGENCY',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blood-requests'] });
      queryClient.invalidateQueries({ queryKey: ['platform-metrics'] });
      Alert.alert(
        'Emergency Request Submitted for Verification 🚨',
        'Your critical emergency request has been received with highest priority. Blood Sanjal administrators review clinical evidence before dispatching emergency broadcast notifications to nearby donors.',
        [
          {
            text: 'View Requests',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Failed to submit emergency request. Please try again.';
      setApiError(message);
    },
  });

  const onSubmit = (data: EmergencyFormData) => {
    setApiError(null);
    createMutation.mutate(data);
  };

  const handleSelectBloodGroup = (bg: string) => {
    setSelectedBloodGroup(bg);
    setValue('bloodGroup', bg);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.alertIconCircle}>
            <Ionicons name="alert" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>Emergency Blood Broadcast</Text>
          <Text style={styles.headerSubtitle}>
            Fast-track submission for critical ICU, trauma, or massive hemorrhage cases.
          </Text>
        </View>

        {/* Verification Rule Notice */}
        <View style={styles.verificationBanner}>
          <Ionicons name="shield-half" size={22} color={colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={styles.verificationTitle}>Admin Verification Policy</Text>
            <Text style={styles.verificationText}>
              To prevent false alarms and donor panic, emergency alerts are verified by the platform team before mobile push broadcasts are triggered.
            </Text>
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {apiError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{apiError}</Text>
            </View>
          )}

          <Controller
            control={control}
            name="patientName"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Patient Name"
                placeholder="Critical patient full name"
                leftIcon="person-outline"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.patientName?.message}
              />
            )}
          />

          {/* Blood Group Chips */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Blood Group Needed</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
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
            name="unitsRequired"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Units / Bags Needed Urgently"
                placeholder="2"
                keyboardType="numeric"
                leftIcon="water-outline"
                onBlur={onBlur}
                onChangeText={onChange}
                value={String(value || 2)}
                error={errors.unitsRequired?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="hospitalName"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Hospital, ICU / Trauma Center & City"
                placeholder="e.g. Tribhuvan University Teaching Hospital, ICU Bay 2"
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
            name="contactPhone"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Emergency Doctor / Staff Direct Phone"
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

          <Controller
            control={control}
            name="reason"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField
                label="Emergency Clinical Reason / Context"
                placeholder="Severe internal hemorrhage, trauma surgery, urgent platelets needed..."
                leftIcon="warning-outline"
                multiline
                numberOfLines={3}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.reason?.message}
              />
            )}
          />

          <View style={{ marginTop: spacing.m }}>
            <PrimaryButton
              title="Submit for Emergency Verification"
              variant="danger"
              icon="alert-circle"
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
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  alertIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  verificationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 3,
  },
  verificationText: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  fieldSection: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  chipsRow: {
    paddingVertical: 2,
  },
  chipMargin: {
    marginRight: 8,
  },
});
