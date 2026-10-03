import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DonorsAPI } from '../../api/donors.api';
import { fonts } from '../../theme';

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
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Availability Status</Text>
          <View style={{ width: 40 }} />
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
            </Text>
            {inactiveUntil && (
               <Text style={styles.statusTimeText}>Until: {new Date(inactiveUntil).toLocaleString()}</Text>
            )}
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
            style={styles.primaryButton}
            onPress={handleMakeActive}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="power" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>Become Active Now</Text>
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
            <Text style={[styles.tabText, activeTab === 'PRESETS' && styles.activeTabText]}>Quick Presets</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'CUSTOM' && styles.activeTab]}
            onPress={() => setActiveTab('CUSTOM')}
          >
            <Text style={[styles.tabText, activeTab === 'CUSTOM' && styles.activeTabText]}>Custom</Text>
          </TouchableOpacity>
        </View>

        {/* Presets Grid */}
        {activeTab === 'PRESETS' && (
          <View style={styles.grid}>
            <TouchableOpacity style={styles.card} onPress={() => handleSetPreset(2, undefined, 'Short errand')}>
              <Text style={styles.cardTitle}>2 Hours</Text>
              <Text style={styles.cardSubtitle}>In meeting or class</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={() => handleSetPreset(3, undefined, 'Personal break')}>
              <Text style={styles.cardTitle}>3 Hours</Text>
              <Text style={styles.cardSubtitle}>Exam or rest</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={() => handleSetPreset(8, undefined, 'Night sleep')}>
              <Text style={styles.cardTitle}>8 Hours</Text>
              <Text style={styles.cardSubtitle}>Night sleep</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={() => handleSetPreset(undefined, 1, 'Busy whole day')}>
              <Text style={styles.cardTitle}>24 Hours</Text>
              <Text style={styles.cardSubtitle}>Busy whole day</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={() => handleSetPreset(undefined, 2, 'Weekend trip')}>
              <Text style={styles.cardTitle}>2 Days</Text>
              <Text style={styles.cardSubtitle}>Weekend trip</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={() => handleSetPreset(undefined, 3, 'Short vacation')}>
              <Text style={styles.cardTitle}>3 Days</Text>
              <Text style={styles.cardSubtitle}>Short vacation</Text>
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
              placeholder="Reason (Optional)"
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
                <Text style={styles.customSubmitText}>Apply Duration</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Safety Info */}
        <View style={styles.infoBox}>
           <Ionicons name="shield-checkmark" size={18} color="#94A3B8" style={{marginRight: 8, marginTop: 2}} />
           <Text style={styles.infoText}>
             You can turn your availability back on manually at any time. When inactive, you will not receive emergency alerts.
           </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 4, marginBottom: 8 },
  iconButton: { padding: 8 },
  headerTitle: { fontSize: 18, color: '#0F172A', fontFamily: fonts.bold },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  
  statusBanner: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  statusBannerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusTitle: { fontSize: 16, color: '#0F172A', fontFamily: fonts.bold },
  statusText: { fontSize: 14, color: '#475569', lineHeight: 20, fontFamily: fonts.regular },
  statusTimeText: { fontSize: 13, color: '#0F172A', marginTop: 8, fontFamily: fonts.semiBold },
  
  primaryButton: { flexDirection: 'row', backgroundColor: '#0F172A', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontFamily: fonts.bold },
  
  tabsContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 10, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  activeTab: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  tabText: { fontSize: 14, color: '#64748B', fontFamily: fonts.semiBold },
  activeTabText: { color: '#0F172A', fontFamily: fonts.bold },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  cardTitle: { fontSize: 16, color: '#0F172A', marginBottom: 4, fontFamily: fonts.bold },
  cardSubtitle: { fontSize: 13, color: '#64748B', lineHeight: 18, fontFamily: fonts.regular },
  
  customSection: { padding: 20, backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  customTitle: { fontSize: 16, color: '#0F172A', marginBottom: 16, fontFamily: fonts.bold },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  numberInput: { flex: 1, height: 50, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 18, textAlign: 'center', color: '#0F172A', marginRight: 12, fontFamily: fonts.bold },
  unitToggle: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, height: 50 },
  unitBtn: { paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  unitBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  unitBtnText: { fontSize: 13, color: '#64748B', fontFamily: fonts.semiBold },
  unitBtnTextActive: { color: '#0F172A', fontFamily: fonts.bold },
  reasonInput: { backgroundColor: '#F8FAFC', height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, fontSize: 14, color: '#0F172A', marginBottom: 20, fontFamily: fonts.regular },
  customSubmitBtn: { backgroundColor: '#DC2626', height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  customSubmitText: { color: '#FFFFFF', fontSize: 15, fontFamily: fonts.bold },
  
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 32, paddingHorizontal: 4 },
  infoText: { flex: 1, fontSize: 13, color: '#94A3B8', lineHeight: 20, fontFamily: fonts.regular }
});
