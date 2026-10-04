import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Switch, ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { DonationsAPI } from '../../api/donations.api';
import { useAuthStore } from '../../store/authStore';

export const DonationEligibilityCard = ({ donorProfile }: { donorProfile: any }) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  // State for Log Donation Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [weight, setWeight] = useState('');
  const [tattoos, setTattoos] = useState(false);
  const [antibiotics, setAntibiotics] = useState(false);
  const [weightError, setWeightError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // State for AI Insights Bottom Sheet
  const [insightsVisible, setInsightsVisible] = useState(false);
  const [aiTips, setAiTips] = useState<string[]>([]);

  const nextDateStr = donorProfile?.inactiveUntil;
  const nextDate = nextDateStr ? new Date(nextDateStr) : null;
  const now = new Date();
  
  let isEligible = true;
  let remainingDays = 0;
  
  if (nextDate && nextDate > now) {
    isEligible = false;
    const diffTime = Math.abs(nextDate.getTime() - now.getTime());
    remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const resetForm = () => {
    setWeight('');
    setTattoos(false);
    setAntibiotics(false);
    setWeightError('');
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setTimeout(resetForm, 300); // Reset after modal closes smoothly
  };

  const logDonationMutation = useMutation({
    mutationFn: (healthData: any) => DonationsAPI.logWithAI({ userId: user?.id || user?._id, healthData }),
    onSuccess: (res) => {
      const data = res.data?.data || res.data;
      
      handleCloseModal();
      
      queryClient.setQueryData(['my-profile'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          inactiveUntil: data.nextEligibleDate,
          totalDonations: data.totalDonations,
          donorStatus: 'UNAVAILABLE'
        };
      });

      // Force a background refetch to ensure absolute synchronization with the backend
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });

      if (data?.recoveryTips && data.recoveryTips.length > 0) {
        setAiTips(data.recoveryTips);
        setTimeout(() => setInsightsVisible(true), 600);
      } else {
        setTimeout(() => Alert.alert('Hero! 🩸', 'Donation Logged Successfully! You are a hero.'), 500);
      }
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.error?.message || 'Failed to log donation.');
    }
  });

  const handleSubmitDonation = () => {
    setWeightError('');
    const weightNum = parseFloat(weight);

    if (isNaN(weightNum) || weightNum < 45 || weightNum > 150) {
      setWeightError('Weight must be between 45 and 150 kg');
      return;
    }

    logDonationMutation.mutate({
      gender: 'MALE', 
      weightKg: weightNum,
      recentTattoos: tattoos,
      recentAntibiotics: antibiotics,
      lastDonationDate: new Date().toISOString(),
    });
  };

  return (
    <View style={styles.container}>
      {/* --- MAIN ELIGIBILITY CARD --- */}
      <View style={[styles.eligibilityCard, isEligible ? styles.eligibleCardBg : styles.ineligibleCardBg]}>
        <View style={[styles.eligibilityIconBox, isEligible ? styles.eligibleIconBg : styles.ineligibleIconBg]}>
          <MaterialCommunityIcons name={isEligible ? "heart-pulse" : "clock-outline"} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.eligibilityTextCol}>
          <Text style={[styles.eligibilityTitle, isEligible ? styles.eligibleTextDark : styles.ineligibleTextDark]}>
            Donation Status
          </Text>
          <Text style={[styles.eligibilitySub, isEligible ? styles.eligibleTextLight : styles.ineligibleTextLight]}>
            {isEligible 
              ? 'You are currently eligible to donate blood!' 
              : `Eligible in ${remainingDays} Days (Next: ${nextDate?.toISOString().split('T')[0]})`}
          </Text>
        </View>
        
        {isEligible ? (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.actionBtnEligible]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>Log Donation</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.actionBtn, styles.actionBtnIneligible]}>
            <Text style={styles.actionBtnText}>Resting</Text>
          </View>
        )}
      </View>

      {/* --- LOG DONATION MODAL --- */}
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={handleCloseModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Log Donation 🩸</Text>
                <Text style={styles.modalSubtitle}>AI will calculate your next safe date.</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={handleCloseModal} disabled={logDonationMutation.isPending}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Current Weight (kg)</Text>
                <View style={[styles.inputContainer, isFocused && styles.inputFocused, weightError ? styles.inputError : null]}>
                  <MaterialCommunityIcons name="weight-kilogram" size={20} color={isFocused ? "#DC2626" : "#94A3B8"} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="E.g., 65"
                    placeholderTextColor="#94A3B8"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    editable={!logDonationMutation.isPending}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                  />
                </View>
                {weightError ? <Text style={styles.errorText}>{weightError}</Text> : null}
              </View>

              <View style={styles.formRow}>
                <View style={styles.rowLabelContainer}>
                  <View style={[styles.rowIconBox, { backgroundColor: '#FEE2E2' }]}>
                    <MaterialCommunityIcons name="draw" size={16} color="#DC2626" />
                  </View>
                  <Text style={styles.rowLabel}>Recent tattoos (last 6 months)</Text>
                </View>
                <Switch value={tattoos} onValueChange={setTattoos} disabled={logDonationMutation.isPending} trackColor={{ true: '#DC2626', false: '#E2E8F0' }} thumbColor="#FFFFFF" />
              </View>

              <View style={styles.formRow}>
                <View style={styles.rowLabelContainer}>
                  <View style={[styles.rowIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <MaterialCommunityIcons name="pill" size={16} color="#D97706" />
                  </View>
                  <Text style={styles.rowLabel}>Antibiotics (last 48 hours)</Text>
                </View>
                <Switch value={antibiotics} onValueChange={setAntibiotics} disabled={logDonationMutation.isPending} trackColor={{ true: '#DC2626', false: '#E2E8F0' }} thumbColor="#FFFFFF" />
              </View>

              <TouchableOpacity 
                style={[styles.submitBtn, logDonationMutation.isPending && styles.submitBtnDisabled]}
                onPress={handleSubmitDonation}
                disabled={logDonationMutation.isPending}
                activeOpacity={0.8}
              >
                {logDonationMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Analyze & Submit</Text>
                    <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- AI INSIGHTS BOTTOM SHEET --- */}
      <Modal animationType="slide" transparent={true} visible={insightsVisible} onRequestClose={() => setInsightsVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.aiModalContent]}>
            <View style={styles.aiHeader}>
              <View style={styles.aiIconWrapper}>
                <Ionicons name="sparkles" size={28} color="#8B5CF6" />
              </View>
              <Text style={styles.aiTitle}>Thank You, Hero!</Text>
              <Text style={styles.aiSubtitle}>Based on your health data, here are your personalized AI recovery tips:</Text>
            </View>
            
            <View style={styles.aiInsightsContainer}>
              {aiTips.map((tip, index) => (
                <View key={index} style={styles.tipRow}>
                  <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" style={{ marginRight: 12, marginTop: 2 }} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.aiSubmitBtn} onPress={() => setInsightsVisible(false)} activeOpacity={0.8}>
              <Text style={styles.submitBtnText}>Got it, thanks!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 12, paddingHorizontal: 16 },
  
  // Card Styles
  eligibilityCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  eligibleCardBg: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#DCFCE7' },
  ineligibleCardBg: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FEF3C7' },
  
  eligibilityIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  eligibleIconBg: { backgroundColor: '#059669' },
  ineligibleIconBg: { backgroundColor: '#D97706' },
  
  eligibilityTextCol: { flex: 1 },
  eligibilityTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  eligibleTextDark: { color: '#064E3B' },
  ineligibleTextDark: { color: '#92400E' },
  
  eligibilitySub: { fontSize: 12, fontFamily: 'Inter_500Medium', lineHeight: 16 },
  eligibleTextLight: { color: '#059669' },
  ineligibleTextLight: { color: '#D97706' },
  
  actionBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginLeft: 8, justifyContent: 'center', alignItems: 'center' },
  actionBtnEligible: { backgroundColor: '#059669' },
  actionBtnIneligible: { backgroundColor: '#FCD34D' },
  actionBtnText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Inter_700Bold' },

  // Modal Overlay
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  
  // Log Donation Modal
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalTitle: { fontSize: 22, color: '#0F172A', fontFamily: 'Inter_800ExtraBold', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: '#64748B', fontFamily: 'Inter_500Medium' },
  closeBtn: { padding: 6, backgroundColor: '#F1F5F9', borderRadius: 20 },
  
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, color: '#334155', fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 16, height: 56 },
  inputFocused: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  inputError: { borderColor: '#EF4444' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#0F172A', fontFamily: 'Inter_500Medium', height: '100%' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 6, fontFamily: 'Inter_500Medium', paddingLeft: 4 },
  
  formRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  rowLabelContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 16 },
  rowIconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowLabel: { fontSize: 14, color: '#334155', fontFamily: 'Inter_600SemiBold', flex: 1 },
  
  submitBtn: { backgroundColor: '#DC2626', height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, elevation: 3, shadowColor: '#DC2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter_700Bold' },

  // AI Insights Modal Specifics
  aiModalContent: { backgroundColor: '#F8FAFC' },
  aiHeader: { alignItems: 'center', marginBottom: 24 },
  aiIconWrapper: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  aiTitle: { fontSize: 24, color: '#5B21B6', fontFamily: 'Inter_800ExtraBold', marginBottom: 8 },
  aiSubtitle: { color: '#64748B', textAlign: 'center', fontSize: 14, fontFamily: 'Inter_500Medium', paddingHorizontal: 20, lineHeight: 20 },
  
  aiInsightsContainer: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#EDE9FE', marginBottom: 28, elevation: 2, shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  tipText: { flex: 1, fontSize: 15, color: '#4C1D95', lineHeight: 22, fontFamily: 'Inter_500Medium' },
  aiSubmitBtn: { backgroundColor: '#7C3AED', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
});

