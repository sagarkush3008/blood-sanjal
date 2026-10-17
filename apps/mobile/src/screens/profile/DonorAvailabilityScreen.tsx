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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DonorsAPI } from '../../api/donors.api';
import { AuthAPI } from '../../api/auth.api';

// Inter Font Tokens
const FONT_REGULAR = 'Inter_400Regular';
const FONT_MEDIUM = 'Inter_500Medium';
const FONT_SEMIBOLD = 'Inter_600SemiBold';
const FONT_BOLD = 'Inter_700Bold';

interface PresetOption {
  id: string;
  title: string;
  subtitle: string;
  hours?: number;
  days?: number;
  iconName: keyof typeof Ionicons.glyphMap;
  reason: string;
}

const PRESET_OPTIONS: PresetOption[] = [
  {
    id: 'p_2h',
    title: 'Inactive for 2 Hours',
    subtitle: 'In meeting, class, or short errand',
    hours: 2,
    iconName: 'time-outline',
    reason: 'In meeting or short errand',
  },
  {
    id: 'p_3h',
    title: 'Inactive for 3 Hours',
    subtitle: 'Personal break or exam session',
    hours: 3,
    iconName: 'time-outline',
    reason: 'Personal break or exam session',
  },
  {
    id: 'p_8h',
    title: 'Inactive for 8 Hours',
    subtitle: 'Night sleep & uninterrupted rest',
    hours: 8,
    iconName: 'moon-outline',
    reason: 'Night sleep & rest',
  },
  {
    id: 'p_1d',
    title: 'Inactive for 1 Day (24 hrs)',
    subtitle: 'Busy whole day with family/work',
    hours: 24,
    iconName: 'calendar-outline',
    reason: 'Busy with family/work for full day',
  },
  {
    id: 'p_2d',
    title: 'Inactive for 2 Days',
    subtitle: 'Weekend trip or temporary rest',
    days: 2,
    iconName: 'calendar-outline',
    reason: 'Weekend trip or rest',
  },
  {
    id: 'p_3d',
    title: 'Inactive for 3 Days',
    subtitle: 'Short vacation or out of town',
    days: 3,
    iconName: 'calendar-outline',
    reason: 'Out of town or vacation',
  },
];

export const DonorAvailabilityScreen = ({ navigation }: any) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'PRESETS' | 'CUSTOM'>('PRESETS');

  // Custom tab form state
  const [customValue, setCustomValue] = useState<string>('5');
  const [customUnit, setCustomUnit] = useState<'HOURS' | 'DAYS'>('HOURS');
  const [customReason, setCustomReason] = useState<string>('');

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
      Alert.alert('Status Active! 🩸', 'You are now Active and visible in live emergency donor searches.');
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
        : 'scheduled duration';

      Alert.alert(
        'Availability Paused ⏸️',
        `You are paused for ${durationDesc}. Your status will automatically reactivate once this duration ends.`
      );
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to set availability pause.';
      Alert.alert('Error', msg);
    },
  });

  const isLoading = isStatusLoading || isProfileLoading;
  const isPendingAction = makeActiveMutation.isPending || setAvailabilityMutation.isPending;

  // Normalized active status
  const isInactive = statusData?.status === 'INACTIVE' || profileData?.donorStatus === 'INACTIVE';
  const isActive = !isInactive;
  const inactiveUntil = profileData?.inactiveUntil;

  const handleApplyPreset = (preset: PresetOption) => {
    setAvailabilityMutation.mutate({
      status: 'INACTIVE',
      durationHours: preset.hours,
      durationDays: preset.days,
      reason: preset.reason,
    });
  };

  const handleApplyCustom = () => {
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
        reason: customReason.trim() || 'Custom pause',
      });
    } else {
      if (val > 90) {
        Alert.alert('Limit Exceeded', 'Maximum duration is 90 days.');
        return;
      }
      setAvailabilityMutation.mutate({
        status: 'INACTIVE',
        durationDays: val,
        reason: customReason.trim() || 'Custom pause',
      });
    }
  };

  const formatUntilDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return null;
      // Format as DD/MM/YYYY, HH:MM:SS matching reference
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
    } catch {
      return null;
    }
  };

  const formattedUntil = formatUntilDate(inactiveUntil);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Fetching Donor Status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Ionicons name="water" size={20} color="#DC2626" style={{ marginRight: 6 }} />
          <Text style={styles.headerTitle}>Donor Availability Status</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            refetchStatus();
            refetchProfile();
          }}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="refresh" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Status Banner Card (Matching Exact Reference Layout) */}
        {isInactive ? (
          <View style={styles.statusCardInactive}>
            <View style={styles.statusCardHeader}>
              <View style={styles.yellowDot} />
              <Text style={styles.statusTitleInactive}>Currently Inactive</Text>
            </View>
            <Text style={styles.statusDescInactive}>
              Emergency notifications and search visibility are temporarily paused.
            </Text>
            {formattedUntil ? (
              <Text style={styles.statusUntilText}>
                Until: <Text style={{ fontFamily: FONT_SEMIBOLD, color: '#92400E' }}>{formattedUntil}</Text>
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.statusCardActive}>
            <View style={styles.statusCardHeader}>
              <View style={styles.greenDot} />
              <Text style={styles.statusTitleActive}>Currently Active</Text>
            </View>
            <Text style={styles.statusDescActive}>
              You are ready and visible in live emergency searches for nearby patients.
            </Text>
          </View>
        )}

        {/* 2. Primary Action Button (Big Vibrant Green Pill) */}
        <TouchableOpacity
          style={[styles.primaryActionBtn, isActive && styles.primaryActionBtnActiveMode]}
          onPress={() => {
            if (isInactive) {
              makeActiveMutation.mutate();
            } else {
              // Quick 2-hour default pause or custom
              setAvailabilityMutation.mutate({
                status: 'INACTIVE',
                durationHours: 8,
                reason: 'Paused by donor',
              });
            }
          }}
          disabled={isPendingAction}
          activeOpacity={0.88}
        >
          {isPendingAction ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.btnContentRow}>
              <Ionicons
                name={isInactive ? 'play-circle-outline' : 'pause-circle-outline'}
                size={22}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.primaryActionBtnText}>
                {isInactive ? 'Make Me Active & Available Now' : 'Pause Availability (Go Inactive)'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 3. Selector Tabs: Quick Presets vs Custom Hours / Days */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'PRESETS' && styles.tabBtnActive]}
            onPress={() => setActiveTab('PRESETS')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="time-outline"
              size={17}
              color={activeTab === 'PRESETS' ? '#0F172A' : '#64748B'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabBtnText, activeTab === 'PRESETS' && styles.tabBtnTextActive]}>
              Quick Presets
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'CUSTOM' && styles.tabBtnActive]}
            onPress={() => setActiveTab('CUSTOM')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="options-outline"
              size={17}
              color={activeTab === 'CUSTOM' ? '#0F172A' : '#64748B'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabBtnText, activeTab === 'CUSTOM' && styles.tabBtnTextActive]}>
              Custom Hours / Days
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. Tab 1: 2-Column Preset Cards Grid */}
        {activeTab === 'PRESETS' ? (
          <View style={styles.presetsGrid}>
            {PRESET_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.presetCard}
                onPress={() => handleApplyPreset(item)}
                disabled={isPendingAction}
                activeOpacity={0.75}
              >
                <View style={styles.presetCardHeader}>
                  <Text style={styles.presetCardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Ionicons name={item.iconName} size={18} color="#475569" style={styles.presetCardIcon} />
                </View>
                <Text style={styles.presetCardSub} numberOfLines={3}>
                  {item.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          /* Tab 2: Custom Hours / Days Minimal Form */
          <View style={styles.customCard}>
            <Text style={styles.customCardTitle}>Set Custom Inactive Duration</Text>
            <Text style={styles.customCardSub}>
              Automatically reactivates when your chosen duration finishes.
            </Text>

            <View style={styles.customInputRow}>
              <TextInput
                style={styles.customNumberInput}
                keyboardType="numeric"
                value={customValue}
                onChangeText={setCustomValue}
                maxLength={3}
                placeholder="5"
                placeholderTextColor="#94A3B8"
              />

              <View style={styles.unitToggleGroup}>
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
              placeholder="Reason (e.g. Traveling / Busy with family)"
              placeholderTextColor="#94A3B8"
              value={customReason}
              onChangeText={setCustomReason}
              maxLength={60}
            />

            <TouchableOpacity
              style={styles.applyCustomBtn}
              onPress={handleApplyCustom}
              disabled={isPendingAction}
              activeOpacity={0.85}
            >
              {isPendingAction ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.applyCustomBtnText}>Apply Custom Inactive Duration</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* 5. Bottom Link & Explainer Footnote */}
        <TouchableOpacity
          style={styles.bottomActiveLink}
          onPress={() => makeActiveMutation.mutate()}
          disabled={isPendingAction}
        >
          <Ionicons name="play-circle-outline" size={18} color="#059669" style={{ marginRight: 6 }} />
          <Text style={styles.bottomActiveLinkText}>Turn back on now (Active)</Text>
        </TouchableOpacity>

        <View style={styles.footnoteRow}>
          <Ionicons name="lock-closed" size={14} color="#D97706" style={{ marginRight: 6, marginTop: 2 }} />
          <Text style={styles.footnoteText}>
            When inactive, you will not receive emergency priority alarms. You can change this setting at any time.
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
    marginTop: 12,
    fontSize: 14,
    fontFamily: FONT_MEDIUM,
    color: '#64748B',
  },
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
    padding: 6,
    borderRadius: 8,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONT_BOLD,
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  /* Status Card (Top Banner) */
  statusCardInactive: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  statusCardActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  yellowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EAB308',
    marginRight: 8,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
    marginRight: 8,
  },
  statusTitleInactive: {
    fontSize: 17,
    fontFamily: FONT_BOLD,
    color: '#0F172A',
  },
  statusTitleActive: {
    fontSize: 17,
    fontFamily: FONT_BOLD,
    color: '#15803D',
  },
  statusDescInactive: {
    fontSize: 13,
    fontFamily: FONT_REGULAR,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 4,
  },
  statusDescActive: {
    fontSize: 13,
    fontFamily: FONT_REGULAR,
    color: '#166534',
    lineHeight: 18,
  },
  statusUntilText: {
    fontSize: 12,
    fontFamily: FONT_REGULAR,
    color: '#78350F',
    marginTop: 4,
  },
  /* Primary Action Button */
  primaryActionBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryActionBtnActiveMode: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryActionBtnText: {
    fontSize: 15,
    fontFamily: FONT_BOLD,
    color: '#FFFFFF',
  },
  /* Tabs Container */
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  tabBtnText: {
    fontSize: 13,
    fontFamily: FONT_MEDIUM,
    color: '#64748B',
  },
  tabBtnTextActive: {
    fontFamily: FONT_BOLD,
    color: '#0F172A',
  },
  /* 2-Column Presets Grid */
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  presetCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    minHeight: 96,
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  presetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  presetCardTitle: {
    fontSize: 13,
    fontFamily: FONT_BOLD,
    color: '#0F172A',
    flex: 1,
    lineHeight: 18,
    marginRight: 4,
  },
  presetCardIcon: {
    marginLeft: 2,
  },
  presetCardSub: {
    fontSize: 11,
    fontFamily: FONT_REGULAR,
    color: '#64748B',
    lineHeight: 15,
  },
  /* Custom Duration Tab Form */
  customCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  customCardTitle: {
    fontSize: 15,
    fontFamily: FONT_BOLD,
    color: '#0F172A',
    marginBottom: 4,
  },
  customCardSub: {
    fontSize: 12,
    fontFamily: FONT_REGULAR,
    color: '#64748B',
    marginBottom: 14,
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  customNumberInput: {
    width: 90,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
    fontSize: 18,
    fontFamily: FONT_BOLD,
    color: '#0F172A',
  },
  unitToggleGroup: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    height: 48,
    alignItems: 'center',
  },
  unitBtn: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  unitBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  unitBtnText: {
    fontSize: 13,
    fontFamily: FONT_MEDIUM,
    color: '#64748B',
  },
  unitBtnTextActive: {
    fontFamily: FONT_BOLD,
    color: '#0F172A',
  },
  reasonInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: FONT_REGULAR,
    color: '#0F172A',
    marginBottom: 14,
  },
  applyCustomBtn: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyCustomBtnText: {
    fontSize: 14,
    fontFamily: FONT_BOLD,
    color: '#FFFFFF',
  },
  /* Bottom Link & Footnote */
  bottomActiveLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  bottomActiveLinkText: {
    fontSize: 14,
    fontFamily: FONT_BOLD,
    color: '#059669',
  },
  footnoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  footnoteText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FONT_REGULAR,
    color: '#64748B',
    lineHeight: 16,
  },
});
