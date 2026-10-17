import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DonorsAPI } from '../../api/donors.api';
import { AuthAPI } from '../../api/auth.api';
import { fonts, colors } from '../../theme';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const SNOOZE_PRESETS = [
  { id: '8h', label: '8 Hours', subtitle: 'Rest / Sleep', hours: 8, days: undefined },
  { id: '24h', label: '24 Hours', subtitle: 'Busy Today', hours: 24, days: undefined },
  { id: '3d', label: '3 Days', subtitle: 'Short Trip', hours: undefined, days: 3 },
  { id: 'indefinite', label: 'Indefinite', subtitle: 'Until I resume', hours: undefined, days: undefined },
];

export const DonorAvailabilityScreen = ({ navigation }: any) => {
  const queryClient = useQueryClient();
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('O+');

  const { data: userData } = useQuery({
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
      Alert.alert('Error', err?.response?.data?.error?.message || 'Failed to save blood group.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.status === 'ACTIVE') {
        return DonorsAPI.updateMyStatus('ACTIVE');
      }
      return DonorsAPI.updateMyAvailability(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donor-status'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['platform-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      refetchStatus();
      refetchProfile();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error?.message || error?.message || 'Failed to update status.';
      Alert.alert('Status Error', msg);
    },
  });

  const isLoading = isStatusLoading || isProfileLoading;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading availability...</Text>
      </SafeAreaView>
    );
  }

  const bloodGroup = userData?.bloodGroup || profileData?.bloodGroup;
  const hasBloodGroup = Boolean(bloodGroup);
  const isInactive = statusData?.status === 'INACTIVE' || profileData?.donorStatus === 'INACTIVE';
  const isActive = !isInactive && hasBloodGroup;
  const inactiveUntil = profileData?.inactiveUntil;
  const inactiveReason = profileData?.inactiveReason;

  const handleToggle = (nextValue: boolean) => {
    if (nextValue) {
      if (!hasBloodGroup) {
        Alert.alert('Blood Group Required', 'Please confirm your blood group below to become active.');
        return;
      }
      updateMutation.mutate({ status: 'ACTIVE' });
    } else {
      updateMutation.mutate({
        status: 'INACTIVE',
        reason: 'Paused by donor',
      });
    }
  };

  const handleSnooze = (preset: typeof SNOOZE_PRESETS[0]) => {
    if (!hasBloodGroup) {
      Alert.alert('Blood Group Required', 'Please select your blood group first.');
      return;
    }
    updateMutation.mutate({
      status: 'INACTIVE',
      durationHours: preset.hours,
      durationDays: preset.days,
      reason: preset.subtitle,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Simplified Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Donor Availability</Text>
        <TouchableOpacity
          onPress={() => {
            refetchStatus();
            refetchProfile();
          }}
          style={styles.refreshButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="refresh" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Missing Blood Group Alert (Only shown if missing) */}
        {!hasBloodGroup && (
          <View style={styles.missingCard}>
            <View style={styles.missingHeader}>
              <Ionicons name="water" size={20} color="#DC2626" />
              <Text style={styles.missingTitle}>Confirm Your Blood Group</Text>
            </View>
            <Text style={styles.missingSub}>
              Select your verified blood group to activate your donor profile.
            </Text>
            <View style={styles.bgRow}>
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
              style={styles.saveBgBtn}
              onPress={() => setBloodGroupMutation.mutate(selectedBloodGroup)}
              disabled={setBloodGroupMutation.isPending}
            >
              {setBloodGroupMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveBgBtnText}>Save & Activate</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Hero Active Status Card */}
        <View style={[styles.heroCard, isActive ? styles.heroCardActive : styles.heroCardInactive]}>
          <View style={styles.heroTop}>
            <View style={[styles.iconCircle, isActive ? styles.iconCircleActive : styles.iconCircleInactive]}>
              <Ionicons
                name={isActive ? 'heart' : 'moon'}
                size={24}
                color={isActive ? '#16A34A' : '#D97706'}
              />
            </View>
            <Switch
              value={isActive}
              onValueChange={handleToggle}
              trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
              thumbColor={isActive ? '#15803D' : '#64748B'}
              disabled={updateMutation.isPending}
            />
          </View>

          <Text style={styles.heroStatusTitle}>
            {isActive ? 'Available to Donate' : 'Currently Paused'}
          </Text>

          <Text style={styles.heroStatusSub}>
            {isActive
              ? 'You are visible to patients & certified blood banks for urgent requests.'
              : 'You will not appear in search results or receive emergency alerts.'}
          </Text>

          {/* Blood Group Tag */}
          {hasBloodGroup && (
            <View style={styles.donorInfoBadge}>
              <Ionicons name="water" size={14} color="#DC2626" />
              <Text style={styles.donorInfoBadgeText}>Group: {bloodGroup}</Text>
            </View>
          )}

          {/* If Inactive with a resume time, show simple resume prompt */}
          {!isActive && (
            <View style={styles.resumeBox}>
              {inactiveUntil ? (
                <Text style={styles.resumeTimeText}>
                  Scheduled to resume: {new Date(inactiveUntil).toLocaleDateString()} at{' '}
                  {new Date(inactiveUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              ) : (
                <Text style={styles.resumeTimeText}>
                  {inactiveReason ? `Reason: ${inactiveReason}` : 'Paused indefinitely'}
                </Text>
              )}

              <TouchableOpacity
                style={styles.resumeButton}
                onPress={() => updateMutation.mutate({ status: 'ACTIVE' })}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="flash" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.resumeButtonText}>Turn On Now</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Simple 1-Tap Pause Presets */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Need a break? Pause easily</Text>
          <Text style={styles.sectionSubtitle}>Tap an option to pause alerts. We'll resume automatically.</Text>
        </View>

        <View style={styles.presetGrid}>
          {SNOOZE_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              style={styles.presetCard}
              activeOpacity={0.7}
              onPress={() => handleSnooze(preset)}
              disabled={updateMutation.isPending}
            >
              <View style={styles.presetIconRow}>
                <Feather
                  name={preset.id === '8h' ? 'clock' : preset.id === '24h' ? 'sun' : preset.id === '3d' ? 'calendar' : 'pause'}
                  size={16}
                  color="#DC2626"
                />
                <Text style={styles.presetLabel}>{preset.label}</Text>
              </View>
              <Text style={styles.presetSub}>{preset.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Safety Note */}
        <View style={styles.footerNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#94A3B8" style={{ marginRight: 6 }} />
          <Text style={styles.footerNoteText}>
            Your phone number and exact address remain completely private until you explicitly accept a contact request.
          </Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontFamily: fonts.semiBold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: '#0F172A',
  },
  refreshButton: {
    padding: 4,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },

  // Missing Blood Group Card
  missingCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  missingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  missingTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#991B1B',
  },
  missingSub: {
    fontSize: 13,
    color: '#7F1D1D',
    marginBottom: 12,
    lineHeight: 18,
  },
  bgRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  bgChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  bgChipActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  bgChipText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#991B1B',
  },
  bgChipTextActive: {
    color: '#FFFFFF',
  },
  saveBgBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveBgBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fonts.bold,
  },

  // Hero Card
  heroCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  heroCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BBF7D0',
  },
  heroCardInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FED7AA',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleActive: {
    backgroundColor: '#DCFCE7',
  },
  iconCircleInactive: {
    backgroundColor: '#FEF3C7',
  },
  heroStatusTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: '#0F172A',
    marginBottom: 6,
  },
  heroStatusSub: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 14,
    fontFamily: fonts.regular,
  },
  donorInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  donorInfoBadgeText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#DC2626',
  },

  // Resume Box (when Inactive)
  resumeBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  resumeTimeText: {
    fontSize: 12,
    color: '#92400E',
    fontFamily: fonts.semiBold,
    marginBottom: 10,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 10,
  },
  resumeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.bold,
  },

  // Presets Section
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#0F172A',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: fonts.regular,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  presetCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  presetLabel: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#0F172A',
  },
  presetSub: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fonts.regular,
  },

  // Footer Note
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    fontFamily: fonts.regular,
  },
});
