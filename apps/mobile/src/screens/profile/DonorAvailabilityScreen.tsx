import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DonorsAPI } from '../../api/donors.api';

export const DonorAvailabilityScreen = ({ navigation }: any) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'PRESETS' | 'CUSTOM'>('PRESETS');
  const [customValue, setCustomValue] = useState('1');
  const [customUnit, setCustomUnit] = useState<'HOURS' | 'DAYS'>('DAYS');
  const [customReason, setCustomReason] = useState('');

  const { data: statusData, isLoading } = useQuery({
    queryKey: ['donor-status'],
    queryFn: () => DonorsAPI.getMyStatus().then((res) => res.data?.data || res.data),
  });

  const { data: profileData } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => DonorsAPI.getMyProfile().then((res) => res.data?.data || res.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      if (data.status === 'ACTIVE') {
        return DonorsAPI.updateMyStatus('ACTIVE');
      }
      return DonorsAPI.updateMyAvailability(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donor-status'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      Alert.alert('Status Updated', 'Your availability status has been updated successfully.');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error?.message || error?.message || 'Failed to update status.';
      Alert.alert('Error', msg);
    },
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );
  }

  const isInactive = statusData?.status === 'INACTIVE' || profileData?.donorStatus === 'INACTIVE';
  const inactiveUntil = profileData?.inactiveUntil;

  const handleSetPreset = (hours?: number, days?: number, label?: string) => {
    updateMutation.mutate({
      status: 'INACTIVE',
      durationHours: hours,
      durationDays: days,
      reason: label || 'Preset unavailability'
    });
  };

  const handleMakeActive = () => {
    updateMutation.mutate({ status: 'ACTIVE' });
  };

  const handleSetCustom = () => {
    const val = parseInt(customValue, 10);
    if (isNaN(val) || val < 1) {
      Alert.alert('Invalid', 'Please enter a valid number.');
      return;
    }
    
    if (customUnit === 'HOURS' && val > 72) {
      Alert.alert('Invalid', 'Maximum custom hours allowed is 72.');
      return;
    }
    
    if (customUnit === 'DAYS' && val > 90) {
      Alert.alert('Invalid', 'Maximum custom days allowed is 90.');
      return;
    }

    updateMutation.mutate({
      status: 'INACTIVE',
      durationHours: customUnit === 'HOURS' ? val : undefined,
      durationDays: customUnit === 'DAYS' ? val : undefined,
      reason: customReason || 'Custom unavailability'
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="water" size={20} color="#E11D48" style={{ marginRight: 8 }} />
            <Text style={styles.headerTitle}>Donor Availability Status</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Current Status Banner */}
        {isInactive ? (
          <View style={[styles.statusBanner, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <View style={styles.statusBannerHeader}>
              <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.statusTitle}>Currently Inactive</Text>
            </View>
            <Text style={styles.statusText}>
              Emergency notifications and search visibility are temporarily paused.
              {inactiveUntil && `\nUntil: ${new Date(inactiveUntil).toLocaleString()}`}
            </Text>
          </View>
        ) : (
          <View style={[styles.statusBanner, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
            <View style={styles.statusBannerHeader}>
              <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.statusTitle}>Currently Active</Text>
            </View>
            <Text style={styles.statusText}>
              You are visible in emergency searches and will receive life-saving broadcasts.
            </Text>
          </View>
        )}

        {/* Action Button */}
        {isInactive && (
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: '#059669' }]}
            onPress={handleMakeActive}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="play-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>Make Me Active & Available Now</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'PRESETS' && styles.activeTab]}
            onPress={() => setActiveTab('PRESETS')}
          >
            <Ionicons name="time-outline" size={16} color={activeTab === 'PRESETS' ? '#0F172A' : '#64748B'} style={{ marginRight: 6 }} />
            <Text style={[styles.tabText, activeTab === 'PRESETS' && styles.activeTabText]}>Quick Presets</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'CUSTOM' && styles.activeTab]}
            onPress={() => setActiveTab('CUSTOM')}
          >
            <Ionicons name="options-outline" size={16} color={activeTab === 'CUSTOM' ? '#0F172A' : '#64748B'} style={{ marginRight: 6 }} />
            <Text style={[styles.tabText, activeTab === 'CUSTOM' && styles.activeTabText]}>Custom Hours / Days</Text>
          </TouchableOpacity>
        </View>

        {/* Presets Grid */}
        {activeTab === 'PRESETS' && (
          <View style={styles.grid}>
            <TouchableOpacity style={styles.card} onPress={() => handleSetPreset(2, undefined, 'Short errand')}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Inactive for 2 Hours</Text>
                <Ionicons name="time-outline" size={16} color="#64748B" />
              </View>
              <Text style={styles.cardSubtitle}>In meeting, class, or short errand</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={() => handleSetPreset(3, undefined, 'Personal break')}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Inactive for 3 Hours</Text>
                <Ionicons name="time-outline" size={16} color="#64748B" />
              </View>
              <Text style={styles.cardSubtitle}>Personal break or exam session</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={() => handleSetPreset(8, undefined, 'Night sleep')}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Inactive for 8 Hours</Text>
                <Ionicons name="moon-outline" size={16} color="#64748B" />
              </View>
              <Text style={styles.cardSubtitle}>Night sleep & uninterrupted rest</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={() => handleSetPreset(undefined, 1, 'Busy whole day')}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Inactive for 1 Day (24 hrs)</Text>
                <Ionicons name="calendar-outline" size={16} color="#64748B" />
              </View>
              <Text style={styles.cardSubtitle}>Busy whole day with family/work</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={() => handleSetPreset(undefined, 2, 'Weekend trip')}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Inactive for 2 Days</Text>
                <Ionicons name="calendar-outline" size={16} color="#64748B" />
              </View>
              <Text style={styles.cardSubtitle}>Weekend trip or temporary rest</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={() => handleSetPreset(undefined, 3, 'Short vacation')}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Inactive for 3 Days</Text>
                <Ionicons name="calendar-outline" size={16} color="#64748B" />
              </View>
              <Text style={styles.cardSubtitle}>Short vacation or out of Birgunj</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Custom Section */}
        {activeTab === 'CUSTOM' && (
          <View style={styles.customSection}>
            <Text style={styles.customTitle}>Set Custom Duration</Text>
            
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
                  <Text style={[styles.unitBtnText, customUnit === 'HOURS' && styles.unitBtnTextActive]}>Hours</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.unitBtn, customUnit === 'DAYS' && styles.unitBtnActive]}
                  onPress={() => setCustomUnit('DAYS')}
                >
                  <Text style={[styles.unitBtnText, customUnit === 'DAYS' && styles.unitBtnTextActive]}>Days</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TextInput 
              style={styles.reasonInput}
              placeholder="Reason (Optional, e.g. Out of town)"
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
                <Text style={styles.customSubmitText}>Apply Custom Status</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Turn back on now */}
        {!isInactive && (
          <View style={{ marginTop: 24, paddingHorizontal: 4 }}>
            <TouchableOpacity style={styles.turnBackOnRow} onPress={() => updateMutation.mutate({ status: 'ACTIVE' })}>
              <Ionicons name="play-circle-outline" size={18} color="#059669" />
              <Text style={styles.turnBackOnText}>You are already Active</Text>
            </TouchableOpacity>
            <View style={styles.warningRow}>
              <Ionicons name="lock-closed" size={14} color="#F59E0B" />
              <Text style={styles.warningText}>
                When inactive, you will not receive emergency priority alarms. You can change this setting at any time.
              </Text>
            </View>
          </View>
        )}

        {isInactive && (
          <View style={{ marginTop: 24, paddingHorizontal: 4 }}>
            <TouchableOpacity style={styles.turnBackOnRow} onPress={handleMakeActive}>
              <Ionicons name="play-circle-outline" size={18} color="#059669" />
              <Text style={styles.turnBackOnText}>Turn back on now (Active)</Text>
            </TouchableOpacity>
            <View style={styles.warningRow}>
              <Ionicons name="lock-closed" size={14} color="#F59E0B" />
              <Text style={styles.warningText}>
                When inactive, you will not receive emergency priority alarms. You can change this setting at any time.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  closeButton: { padding: 6, backgroundColor: '#F1F5F9', borderRadius: 20 },
  container: { padding: 16 },
  statusBanner: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  statusBannerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  statusTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  statusText: { fontSize: 13, color: '#475569', lineHeight: 18 },
  primaryButton: { flexDirection: 'row', padding: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 8, padding: 4, marginBottom: 20 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 6 },
  activeTab: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#0F172A' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 8 },
  cardSubtitle: { fontSize: 12, color: '#64748B', lineHeight: 16 },
  customSection: { padding: 20, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  customTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  numberInput: { flex: 1, height: 50, backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', fontSize: 18, fontWeight: '700', textAlign: 'center', color: '#0F172A', marginRight: 12 },
  unitToggle: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 10, padding: 4, height: 50 },
  unitBtn: { paddingHorizontal: 20, justifyContent: 'center', borderRadius: 8 },
  unitBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  unitBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  unitBtnTextActive: { color: '#0F172A' },
  reasonInput: { backgroundColor: '#F8FAFC', height: 50, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 16, fontSize: 14, color: '#0F172A', marginBottom: 20 },
  customSubmitBtn: { backgroundColor: '#E11D48', height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  customSubmitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  
  turnBackOnRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  turnBackOnText: { color: '#059669', fontWeight: '700', fontSize: 15, marginLeft: 8 },
  warningRow: { flexDirection: 'row', alignItems: 'flex-start', paddingRight: 16 },
  warningText: { fontSize: 12, color: '#94A3B8', marginLeft: 8, lineHeight: 16, flex: 1 },
});
