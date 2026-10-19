import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DonorsAPI } from '../../api/donors.api';

// Inter Font Tokens
const FONT_REGULAR = 'Inter_400Regular';
const FONT_MEDIUM = 'Inter_500Medium';
const FONT_SEMIBOLD = 'Inter_600SemiBold';
const FONT_BOLD = 'Inter_700Bold';
const FONT_EXTRABOLD = 'Inter_800ExtraBold';

interface PresetItem {
  id: string;
  label: string;
  sub: string;
  hours?: number;
  days?: number;
  icon: keyof typeof Ionicons.glyphMap;
  reason?: string;
}

const PRESETS: PresetItem[] = [
  { id: '2h', label: '2 Hours', sub: 'Short errand / class', hours: 2, icon: 'time-outline' },
  { id: '8h', label: '8 Hours', sub: 'Night sleep & rest', hours: 8, icon: 'moon-outline' },
  { id: '24h', label: '1 Day', sub: 'Busy with work / family', hours: 24, icon: 'calendar-outline' },
  { id: '3d', label: '3 Days', sub: 'Trip / out of town', days: 3, icon: 'airplane-outline' },
];

export const DonorAvailabilityScreen = ({ navigation }: any) => {
  const queryClient = useQueryClient();

  // Selected preset (default to 2 hours)
  const [selectedPresetId, setSelectedPresetId] = useState<string>('2h');
  const [showCustom, setShowCustom] = useState<boolean>(false);

  // Custom Form State (reason is completely optional)
  const [customValue, setCustomValue] = useState<string>('5');
  const [customUnit, setCustomUnit] = useState<'HOURS' | 'DAYS'>('HOURS');
  const [customReason, setCustomReason] = useState<string | undefined>(undefined);

  // Fetch status & profile from backend
  const { data: statusData, isLoading: isStatusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['donor-status'],
    queryFn: () => DonorsAPI.getMyStatus().then((res) => res.data?.data || res.data).catch(() => null),
  });

  const { data: profileData, isLoading: isProfileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => DonorsAPI.getMyProfile().then((res) => res.data?.data || res.data).catch(() => null),
  });

  // Make Active mutation
  const makeActiveMutation = useMutation({
    mutationFn: async () => DonorsAPI.updateMyStatus('ACTIVE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donor-status'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['platform-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      refetchStatus();
      refetchProfile();
      Alert.alert('Status Active! 🩸', 'You are now online and visible in emergency donor searches.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to activate status.';
      Alert.alert('Status Error', msg);
    },
  });

  // Inactive / Snooze duration mutation
  const setAvailabilityMutation = useMutation({
    mutationFn: async (payload: { status: 'INACTIVE'; durationHours?: number; durationDays?: number; reason?: string }) => {
      return DonorsAPI.updateMyAvailability(payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['donor-status'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      refetchStatus();
      refetchProfile();

      const durationDesc = variables.durationHours
        ? `${variables.durationHours} hours`
        : variables.durationDays
        ? `${variables.durationDays} days`
        : 'chosen duration';

      Alert.alert(
        'Availability Paused ⏸️',
        `Your status is paused for ${durationDesc}. You will automatically reactivate once this duration completes.`
      );
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to update availability.';
      Alert.alert('Error', msg);
    },
  });

  const isLoading = isStatusLoading || isProfileLoading;
  const isPendingAction = makeActiveMutation.isPending || setAvailabilityMutation.isPending;

  // Normalized active status
  const isInactive = statusData?.status === 'INACTIVE' || profileData?.donorStatus === 'INACTIVE';
  const isActive = !isInactive;
  const inactiveUntil = profileData?.inactiveUntil;

  const onRefresh = () => {
    refetchStatus();
    refetchProfile();
  };

  const formatReturnTime = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      const now = new Date();
      const diffMs = d.getTime() - now.getTime();

      let relative = '';
      if (diffMs > 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays > 0) {
          relative = `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
        } else if (diffHours > 0) {
          relative = `in ${diffHours} hr${diffHours > 1 ? 's' : ''}`;
        } else {
          const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
          relative = `in ${diffMins} min${diffMins > 1 ? 's' : ''}`;
        }
      } else {
        relative = 'any moment';
      }

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayName = dayNames[d.getDay()];
      const monthName = monthNames[d.getMonth()];
      const dateNum = d.getDate();

      let hours = d.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const mins = String(d.getMinutes()).padStart(2, '0');
      const timeOnly = `${hours}:${mins} ${ampm}`;
      const exact = `${dayName}, ${monthName} ${dateNum} · ${timeOnly}`;
      return { relative, exact, timeOnly };
    } catch {
      return null;
    }
  };

  const returnInfo = formatReturnTime(inactiveUntil);
  const selectedPreset = PRESETS.find((p) => p.id === selectedPresetId);

  const handleApplyBreak = () => {
    if (showCustom) {
      const val = parseInt(customValue.trim(), 10);
      if (isNaN(val) || val <= 0) {
        Alert.alert('Invalid Duration', 'Please enter a valid positive number.');
        return;
      }
      if (customUnit === 'HOURS') {
        if (val > 72) {
          Alert.alert('Limit Exceeded', 'Maximum duration in hours is 72. For longer periods, select Days.');
          return;
        }
        setAvailabilityMutation.mutate({
          status: 'INACTIVE',
          durationHours: val,
          reason: customReason?.trim() || undefined,
        });
      } else {
        if (val > 90) {
          Alert.alert('Limit Exceeded', 'Maximum duration is 90 days.');
          return;
        }
        setAvailabilityMutation.mutate({
          status: 'INACTIVE',
          durationDays: val,
          reason: customReason?.trim() || undefined,
        });
      }
    } else if (selectedPreset) {
      setAvailabilityMutation.mutate({
        status: 'INACTIVE',
        durationHours: selectedPreset.hours,
        durationDays: selectedPreset.days,
        reason: undefined,
      });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Fetching status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Donor Availability</Text>

        <TouchableOpacity
          onPress={onRefresh}
          style={styles.headerBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="refresh-outline" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. Hero Status Card with Big Red "Become Active" Button (No Switch) */}
        <View style={[styles.heroCard, isActive ? styles.heroCardActive : styles.heroCardInactive]}>
          <View style={styles.statusBadgeRow}>
            <View style={[styles.statusDot, isActive ? styles.statusDotActive : styles.statusDotInactive]}>
              <View style={[styles.statusDotCore, isActive ? styles.statusDotCoreActive : styles.statusDotCoreInactive]} />
            </View>
            <Text style={[styles.statusHeading, isActive ? styles.statusHeadingActive : styles.statusHeadingInactive]}>
              {isActive ? 'Available to Donate' : 'Temporarily Paused'}
            </Text>
          </View>

          <Text style={styles.statusDescription}>
            {isActive
              ? 'You are live and visible to emergency patients in need of blood.'
              : returnInfo
              ? `Reactivates ${returnInfo.relative} (Paused until ${returnInfo.timeOnly})`
              : 'Emergency broadcast alerts are paused.'}
          </Text>

          {/* Big Vibrant Red Action Button (Replacing the old switch) */}
          <TouchableOpacity
            style={styles.becomeActiveBtn}
            onPress={() => {
              if (!isActive) {
                makeActiveMutation.mutate();
              } else {
                Alert.alert('Status Active 🩸', 'You are already active and visible to emergency patients.');
              }
            }}
            disabled={isPendingAction}
            activeOpacity={0.88}
          >
            {makeActiveMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.becomeActiveContent}>
                <Ionicons name="flash" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.becomeActiveText}>Become Active</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 3. Section Title */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {isActive ? 'Schedule a Pause' : 'Adjust Pause Duration'}
          </Text>
          <Text style={styles.sectionSubtitle}>
            Choose a quick duration to pause emergency alerts.
          </Text>
        </View>

        {/* 4. Time Duration Cards (2x2 Presets Grid) */}
        <View style={styles.presetsGrid}>
          {PRESETS.map((item) => {
            const isSelected = selectedPresetId === item.id && !showCustom;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.presetCard, isSelected && styles.presetCardSelected]}
                onPress={() => {
                  setSelectedPresetId(item.id);
                  setShowCustom(false);
                }}
                activeOpacity={0.75}
              >
                <View style={styles.presetTopRow}>
                  <View style={[styles.presetIconBox, isSelected && styles.presetIconBoxSelected]}>
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={isSelected ? '#DC2626' : '#475569'}
                    />
                  </View>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={18} color="#DC2626" />
                  ) : (
                    <View style={styles.emptyRadioCircle} />
                  )}
                </View>
                <Text style={[styles.presetLabel, isSelected && styles.presetLabelSelected]}>
                  {item.label}
                </Text>
                <Text style={styles.presetSub} numberOfLines={1}>
                  {item.sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 5. Minimal Confirmation Button (Directly below time duration cards) */}
        <TouchableOpacity
          style={styles.minimalActionBtn}
          onPress={handleApplyBreak}
          disabled={isPendingAction}
          activeOpacity={0.75}
        >
          {setAvailabilityMutation.isPending ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <View style={styles.actionBtnRow}>
              <Ionicons name="pause-circle-outline" size={18} color="#DC2626" style={{ marginRight: 8 }} />
              <Text style={styles.minimalActionBtnText}>
                {showCustom
                  ? `Pause for ${customValue || '1'} ${customUnit.toLowerCase()}`
                  : `Pause for ${selectedPreset?.label || 'Selected Break'}`}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 6. Custom Duration Accordion */}
        <TouchableOpacity
          style={[styles.customTrigger, showCustom && styles.customTriggerActive]}
          onPress={() => setShowCustom(!showCustom)}
          activeOpacity={0.75}
        >
          <View style={styles.customTriggerLeft}>
            <View style={[styles.customIconBox, showCustom && styles.customIconBoxActive]}>
              <Ionicons
                name="options-outline"
                size={16}
                color={showCustom ? '#DC2626' : '#64748B'}
              />
            </View>
            <Text style={[styles.customTriggerText, showCustom && styles.customTriggerTextActive]}>
              Custom Duration
            </Text>
          </View>
          <Ionicons
            name={showCustom ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={showCustom ? '#DC2626' : '#94A3B8'}
          />
        </TouchableOpacity>

        {showCustom && (
          <View style={styles.customFormBox}>
            <Text style={styles.customFormHelp}>Enter the duration you wish to remain paused:</Text>
            <View style={styles.customInputRow}>
              <TextInput
                style={styles.customNumberInput}
                keyboardType="numeric"
                value={customValue}
                onChangeText={setCustomValue}
                maxLength={3}
                placeholder="4"
                placeholderTextColor="#94A3B8"
              />

              <View style={styles.unitToggleContainer}>
                <TouchableOpacity
                  style={[styles.unitToggleBtn, customUnit === 'HOURS' && styles.unitToggleBtnActive]}
                  onPress={() => setCustomUnit('HOURS')}
                >
                  <Text style={[styles.unitToggleText, customUnit === 'HOURS' && styles.unitToggleTextActive]}>
                    Hours
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.unitToggleBtn, customUnit === 'DAYS' && styles.unitToggleBtnActive]}
                  onPress={() => setCustomUnit('DAYS')}
                >
                  <Text style={[styles.unitToggleText, customUnit === 'DAYS' && styles.unitToggleTextActive]}>
                    Days
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* 7. Minimal Privacy / Info Note */}
        <View style={styles.infoFooter}>
          <Ionicons name="shield-checkmark-outline" size={15} color="#94A3B8" style={{ marginRight: 8, marginTop: 1 }} />
          <Text style={styles.infoFooterText}>
            You will automatically return to Active once the timer expires. You can re-enable status at any moment.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: FONT_MEDIUM,
    color: '#64748B',
  },
  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONT_BOLD,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 40,
  },
  /* Hero Status Card */
  heroCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1.5,
  },
  heroCardActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  heroCardInactive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: '#DCFCE7',
  },
  statusDotInactive: {
    backgroundColor: '#FEF3C7',
  },
  statusDotCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotCoreActive: {
    backgroundColor: '#16A34A',
  },
  statusDotCoreInactive: {
    backgroundColor: '#D97706',
  },
  statusHeading: {
    fontSize: 16,
    fontFamily: FONT_EXTRABOLD,
    letterSpacing: -0.3,
  },
  statusHeadingActive: {
    color: '#15803D',
  },
  statusHeadingInactive: {
    color: '#B45309',
  },
  statusDescription: {
    fontSize: 12,
    fontFamily: FONT_REGULAR,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 4,
  },
  /* Big Red "Become Active" Button */
  becomeActiveBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  becomeActiveContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  becomeActiveText: {
    fontSize: 14.5,
    fontFamily: FONT_BOLD,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  /* Section Header */
  sectionHeaderRow: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: FONT_BOLD,
    color: '#0F172A',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: FONT_REGULAR,
    color: '#64748B',
  },
  /* 2x2 Presets Grid */
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  presetCard: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
  },
  presetCardSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  presetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  presetIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  presetIconBoxSelected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  emptyRadioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  presetLabel: {
    fontSize: 13.5,
    fontFamily: FONT_BOLD,
    color: '#0F172A',
    marginBottom: 2,
  },
  presetLabelSelected: {
    color: '#DC2626',
  },
  presetSub: {
    fontSize: 11,
    fontFamily: FONT_REGULAR,
    color: '#64748B',
    lineHeight: 15,
  },
  /* Minimal Confirmation Button (Directly below duration cards) */
  minimalActionBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minimalActionBtnText: {
    fontSize: 14.5,
    fontFamily: FONT_BOLD,
    color: '#DC2626',
    letterSpacing: -0.2,
  },
  /* Custom Duration Accordion */
  customTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  customTriggerActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  customTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  customIconBoxActive: {
    backgroundColor: '#FEE2E2',
  },
  customTriggerText: {
    fontSize: 13,
    fontFamily: FONT_SEMIBOLD,
    color: '#475569',
  },
  customTriggerTextActive: {
    color: '#DC2626',
    fontFamily: FONT_BOLD,
  },
  customFormBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  customFormHelp: {
    fontSize: 11.5,
    fontFamily: FONT_REGULAR,
    color: '#64748B',
    marginBottom: 10,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  customNumberInput: {
    width: 76,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
    fontSize: 16,
    fontFamily: FONT_BOLD,
    color: '#0F172A',
  },
  unitToggleContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    height: 42,
  },
  unitToggleBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  unitToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  unitToggleText: {
    fontSize: 12,
    fontFamily: FONT_MEDIUM,
    color: '#64748B',
  },
  unitToggleTextActive: {
    fontFamily: FONT_BOLD,
    color: '#0F172A',
  },
  customReasonInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    fontSize: 12,
    fontFamily: FONT_REGULAR,
    color: '#0F172A',
  },
  /* Footer Notice */
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoFooterText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FONT_REGULAR,
    color: '#64748B',
    lineHeight: 16,
  },
});
