import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DonorsAPI } from '../../api/donors.api';
import { AuthAPI } from '../../api/auth.api';
import { fonts, colors } from '../../theme';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const DonorAvailabilityScreen = ({ navigation }: any) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'PRESETS' | 'CUSTOM'>('PRESETS');
  const [customValue, setCustomValue] = useState('1');
  const [customUnit, setCustomUnit] = useState<'HOURS' | 'DAYS'>('DAYS');
  const [customReason, setCustomReason] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('O+');

  const { data: userData, refetch: refetchUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => AuthAPI.getCurrentUser().then((res) => res.data?.data || res.data).catch(() => null),
  });

  const { data: statusData, isLoading: isStatusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['donor-status'],
    queryFn: () => DonorsAPI.getMyStatus().then((res) => res.data?.data || res.data).catch(() => null),
  });

  const { data: profileData, isLoading: isProfileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => DonorsAPI.getMyProfile().then((res) => res.data?.data || res.data).catch(() => null),
  });

  const setBloodGroupMutation = useMutation({
    mutationFn: (bloodGroup: string) => AuthAPI.updateProfile({ bloodGroup }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      queryClient.invalidateQueries({ queryKey: ['donor-status'] });
      updateMutation.mutate({ status: 'ACTIVE' });
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.error?.message || 'Failed to set blood group.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.status === 'ACTIVE') {
        return DonorsAPI.updateMyStatus('ACTIVE');
      }
      return DonorsAPI.updateMyAvailability(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['donor-status'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['platform-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });

      const newStatus = variables?.status;
      Alert.alert(
        newStatus === 'ACTIVE' ? 'You are now Active! 🩸' : 'Availability Paused ⏸️',
        newStatus === 'ACTIVE'
          ? 'Your profile is visible in live donor searches and emergency broadcasts.'
          : 'Your donor status has been paused. Emergency alerts are temporarily snoozed.',
        [
          {
            text: 'OK',
            onPress: () => {
              refetchStatus();
              refetchProfile();
            }
          }
        ]
      );
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error?.message || error?.message || 'Failed to update status.';
      Alert.alert('Status Error', msg);
    },
  });

  const isLoading = isStatusLoading || isProfileLoading;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Fetching Donor Status...</Text>
      </View>
    );
  }

  const hasBloodGroup = !!(userData?.bloodGroup || profileData?.bloodGroup);
  const isInactive = statusData?.status === 'INACTIVE' || profileData?.donorStatus === 'INACTIVE';
  const isActive = !isInactive && hasBloodGroup;
  const inactiveUntil = profileData?.inactiveUntil;
  const inactiveReason = profileData?.inactiveReason;

  const handleToggle = (value: boolean) => {
    if (value) {
      if (!hasBloodGroup) {
        Alert.alert('Blood Group Required', 'Please select your blood group below before activating donor status.');
        return;
      }
      updateMutation.mutate({ status: 'ACTIVE' });
    } else {
      updateMutation.mutate({
        status: 'INACTIVE',
        reason: 'Manually paused by user'
      });
    }
  };

  const handleMakeActive = () => {
    if (!hasBloodGroup) {
      setBloodGroupMutation.mutate(selectedBloodGroup);
      return;
    }
    updateMutation.mutate({ status: 'ACTIVE' });
  };

  const handleMakeInactiveIndefinite = () => {
    updateMutation.mutate({
      status: 'INACTIVE',
      reason: 'Paused indefinitely'
    });
  };

  const handleSetPreset = (hours?: number, days?: number, label?: string) => {
    if (!hasBloodGroup) {
      Alert.alert('Blood Group Required', 'Please select your blood group before managing availability.');
      return;
    }
    updateMutation.mutate({
      status: 'INACTIVE',
      durationHours: hours,
      durationDays: days,
      reason: label || 'Preset unavailability'
    });
  };

  const handleSetCustom = () => {
    if (!hasBloodGroup) {
      Alert.alert('Blood Group Required', 'Please select your blood group first.');
      return;
    }
    const val = parseInt(customValue, 10);
    if (isNaN(val) || val < 1) {
      Alert.alert('Invalid Duration', 'Please enter a valid positive number.');
      return;
    }

    if (customUnit === 'HOURS' && val > 72) {
      Alert.alert('Invalid', 'Maximum custom duration is 72 hours.');
      return;
    }

    if (customUnit === 'DAYS' && val > 90) {
      Alert.alert('Invalid', 'Maximum custom duration is 90 days.');
      return;
    }

    updateMutation.mutate({
      status: 'INACTIVE',
      durationHours: customUnit === 'HOURS' ? val : undefined,
      durationDays: customUnit === 'DAYS' ? val : undefined,
      reason: customReason.trim() || 'Custom unavailability'
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Donor Active Status</Text>
          <TouchableOpacity onPress={() => { refetchStatus(); refetchProfile(); }} style={styles.iconButton}>
            <Ionicons name="refresh" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Missing Blood Group Card */}
        {!hasBloodGroup && (
          <View style={styles.missingBgCard}>
            <View style={styles.missingBgHeader}>
              <Ionicons name="water" size={22} color="#DC2626" />
              <Text style={styles.missingBgTitle}>Select Blood Group First</Text>
            </View>
            <Text style={styles.missingBgDesc}>
              Before you can go active as a donor, please confirm your verified blood group.
            </Text>
            <View style={styles.bgGrid}>
              {BLOOD_GROUPS.map((bg) => (
                <TouchableOpacity
                  key={bg}
                  style={[styles.bgChip, selectedBloodGroup === bg && styles.bgChipActive]}
                  onPress={() => setSelectedBloodGroup(bg)}
                >
                  <Text style={[styles.bgChipText, selectedBloodGroup === bg && styles.bgChipTextActive]}>
                    {bg}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.saveBgButton}
              onPress={() => setBloodGroupMutation.mutate(selectedBloodGroup)}
              disabled={setBloodGroupMutation.isPending}
            >
              {setBloodGroupMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveBgButtonText}>Save Blood Group & Activate</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Interactive Master Switch */}
        <View style={styles.switchCard}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.statusIndicatorDot, { backgroundColor: isActive ? '#22C55E' : '#F59E0B' }]} />
              <Text style={styles.switchTitle}>
                {isActive ? 'Available to Donate' : 'Unavailable / Paused'}
              </Text>
            </View>
            <Text style={styles.switchSub}>
              {isActive
                ? 'You are active in search results and receive alerts.'
                : 'Emergency broadcasts and search matches are snoozed.'}
            </Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={handleToggle}
            trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
            thumbColor={isActive ? '#15803D' : '#64748B'}
            disabled={updateMutation.isPending}
          />
        </View>

        {/* Current Status Banner */}
        {isActive ? (
          <View style={[styles.statusBanner, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
            <View style={styles.statusBannerHeader}>
              <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.statusTitle, { color: '#15803D' }]}>Status: Active & Ready</Text>
            </View>
            <Text style={styles.statusText}>
              Verified hospitals and patients in your area can discover your approximate location and send life-saving requests.
            </Text>
            <TouchableOpacity
              style={styles.pauseDirectButton}
              onPress={handleMakeInactiveIndefinite}
              disabled={updateMutation.isPending}
            >
              <Feather name="pause-circle" size={16} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.pauseDirectButtonText}>Pause Indefinitely</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.statusBanner, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <View style={styles.statusBannerHeader}>
              <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.statusTitle, { color: '#B45309' }]}>Status: Currently Paused</Text>
            </View>
            <Text style={styles.statusText}>
              Emergency broadcasts and direct discovery are snoozed.
            </Text>
            {inactiveReason && (
              <Text style={styles.inactiveReasonText}>Reason: "{inactiveReason}"</Text>
            )}
            {inactiveUntil && (
              <Text style={styles.statusTimeText}>
                Scheduled Resume: {new Date(inactiveUntil).toLocaleString()}
              </Text>
            )}
            <TouchableOpacity
              style={styles.activeDirectButton}
              onPress={handleMakeActive}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="power" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.activeDirectButtonText}>Become Active Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Snooze Presets Section Heading */}
        <Text style={styles.sectionHeading}>Schedule Temporary Pause (Snooze)</Text>
        <Text style={styles.sectionSub}>Automatically reactivate after your scheduled duration ends.</Text>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'PRESETS' && styles.activeTab]}
            onPress={() => setActiveTab('PRESETS')}
          >
            <Text style={[styles.tabText, activeTab === 'PRESETS' && styles.activeTabText]}>
              Quick Presets
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'CUSTOM' && styles.activeTab]}
            onPress={() => setActiveTab('CUSTOM')}
          >
            <Text style={[styles.tabText, activeTab === 'CUSTOM' && styles.activeTabText]}>
              Custom Duration
            </Text>
          </TouchableOpacity>
        </View>

        {/* Presets Grid */}
        {activeTab === 'PRESETS' && (
          <View style={styles.grid}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleSetPreset(2, undefined, 'In meeting or class')}
            >
              <Text style={styles.cardTitle}>2 Hours</Text>
              <Text style={styles.cardSubtitle}>In meeting or class</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => handleSetPreset(3, undefined, 'Exam or personal break')}
            >
              <Text style={styles.cardTitle}>3 Hours</Text>
              <Text style={styles.cardSubtitle}>Exam or rest</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => handleSetPreset(8, undefined, 'Night sleep')}
            >
              <Text style={styles.cardTitle}>8 Hours</Text>
              <Text style={styles.cardSubtitle}>Night sleep</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => handleSetPreset(undefined, 1, 'Busy whole day')}
            >
              <Text style={styles.cardTitle}>24 Hours</Text>
              <Text style={styles.cardSubtitle}>Busy whole day</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => handleSetPreset(undefined, 2, 'Weekend trip')}
            >
              <Text style={styles.cardTitle}>2 Days</Text>
              <Text style={styles.cardSubtitle}>Weekend trip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => handleSetPreset(undefined, 3, 'Short vacation')}
            >
              <Text style={styles.cardTitle}>3 Days</Text>
              <Text style={styles.cardSubtitle}>Short vacation</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Custom Duration Section */}
        {activeTab === 'CUSTOM' && (
          <View style={styles.customSection}>
            <Text style={styles.customTitle}>Specify Snooze Duration</Text>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.numberInput}
                keyboardType="number-pad"
                value={customValue}
                onChangeText={setCustomValue}
                maxLength={2}
              />

              <View style={styles.unitToggle}>
                <TouchableOpacity
                  style={[styles.unitBtn, customUnit === 'HOURS' && styles.unitBtnActive]}
                  onPress={() => setCustomUnit('HOURS')}
                >
                  <Text style={[styles.unitBtnText, customUnit === 'HOURS' && styles.unitBtnTextActive]}>
                    Hours
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitBtn, customUnit === 'DAYS' && styles.unitBtnActive]}
                  onPress={() => setCustomUnit('DAYS')}
                >
                  <Text style={[styles.unitBtnText, customUnit === 'DAYS' && styles.unitBtnTextActive]}>
                    Days
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              style={styles.reasonInput}
              placeholder="Reason for pausing (optional)"
              placeholderTextColor="#94A3B8"
              value={customReason}
              onChangeText={setCustomReason}
              maxLength={100}
            />

            <TouchableOpacity
              style={styles.customSubmitBtn}
              onPress={handleSetCustom}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.customSubmitText}>Apply Snooze Duration</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Safety Info */}
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={18} color="#94A3B8" style={{ marginRight: 8, marginTop: 2 }} />
          <Text style={styles.infoText}>
            You can restore your availability anytime. Your personal phone and address remain masked until you explicitly consent to a contact request.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B', fontFamily: fonts.medium },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  iconButton: { padding: 8 },
  headerTitle: { fontSize: 18, color: '#0F172A', fontFamily: fonts.bold },
  container: { paddingHorizontal: 20, paddingBottom: 40 },

  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  statusIndicatorDot: { width: 10, height: 10, borderRadius: 5 },
  switchTitle: { fontSize: 16, color: '#0F172A', fontFamily: fonts.bold },
  switchSub: { fontSize: 12, color: '#64748B', marginTop: 3, fontFamily: fonts.regular },

  missingBgCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  missingBgHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  missingBgTitle: { fontSize: 15, fontFamily: fonts.bold, color: '#991B1B' },
  missingBgDesc: { fontSize: 13, color: '#7F1D1D', lineHeight: 18, marginBottom: 12 },
  bgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  bgChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  bgChipActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  bgChipText: { fontSize: 13, fontFamily: fonts.bold, color: '#991B1B' },
  bgChipTextActive: { color: '#FFFFFF' },
  saveBgButton: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBgButtonText: { color: '#FFFFFF', fontSize: 14, fontFamily: fonts.bold },

  statusBanner: { padding: 18, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  statusBannerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusTitle: { fontSize: 16, fontFamily: fonts.bold },
  statusText: { fontSize: 14, color: '#475569', lineHeight: 20, fontFamily: fonts.regular },
  inactiveReasonText: { fontSize: 13, color: '#92400E', marginTop: 6, fontStyle: 'italic' },
  statusTimeText: { fontSize: 13, color: '#0F172A', marginTop: 6, fontFamily: fonts.semiBold },

  pauseDirectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 14,
  },
  pauseDirectButtonText: { color: '#DC2626', fontSize: 14, fontFamily: fonts.bold },

  activeDirectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  activeDirectButtonText: { color: '#FFFFFF', fontSize: 14, fontFamily: fonts.bold },

  sectionHeading: { fontSize: 16, color: '#0F172A', fontFamily: fonts.bold, marginBottom: 4 },
  sectionSub: { fontSize: 13, color: '#64748B', fontFamily: fonts.regular, marginBottom: 14 },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: { fontSize: 13, color: '#64748B', fontFamily: fonts.semiBold },
  activeTabText: { color: '#0F172A', fontFamily: fonts.bold },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: { fontSize: 16, color: '#0F172A', marginBottom: 4, fontFamily: fonts.bold },
  cardSubtitle: { fontSize: 12, color: '#64748B', lineHeight: 16, fontFamily: fonts.regular },

  customSection: {
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customTitle: { fontSize: 15, color: '#0F172A', marginBottom: 14, fontFamily: fonts.bold },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  numberInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 18,
    textAlign: 'center',
    color: '#0F172A',
    marginRight: 12,
    fontFamily: fonts.bold,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    height: 48,
  },
  unitBtn: { paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  unitBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unitBtnText: { fontSize: 13, color: '#64748B', fontFamily: fonts.semiBold },
  unitBtnTextActive: { color: '#0F172A', fontFamily: fonts.bold },
  reasonInput: {
    backgroundColor: '#F8FAFC',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 16,
    fontFamily: fonts.regular,
  },
  customSubmitBtn: {
    backgroundColor: '#DC2626',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customSubmitText: { color: '#FFFFFF', fontSize: 14, fontFamily: fonts.bold },

  infoBox: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 28, paddingHorizontal: 4 },
  infoText: { flex: 1, fontSize: 12, color: '#94A3B8', lineHeight: 18, fontFamily: fonts.regular },
});
