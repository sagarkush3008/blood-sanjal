import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Switch, ActivityIndicator, Alert } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
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

  const logDonationMutation = useMutation({
    mutationFn: (healthData: any) => DonationsAPI.logWithAI({ userId: user?.id || user?._id, healthData }),
    onSuccess: (res) => {
      const data = res.data?.data || res.data;
      
      // 1. Instantly Close the form modal
      setModalVisible(false);
      
      // 2. Show Success Toast Notification
      Alert.alert('Hero! 🩸', 'Donation Logged Successfully! You are a hero.');

      // 3. Automatically Update Global State (React Query Cache)
      queryClient.setQueryData(['my-profile'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          inactiveUntil: data.nextEligibleDate,
          totalDonations: data.totalDonations,
          donorStatus: 'UNAVAILABLE'
        };
      });

      // 4. Trigger AI Insights Popup
      if (data?.recoveryTips && data.recoveryTips.length > 0) {
        setAiTips(data.recoveryTips);
        setTimeout(() => setInsightsVisible(true), 500); // Slight delay for smooth UX
      }
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.error?.message || 'Failed to log donation.');
    }
  });

  const handleSubmitDonation = () => {
    setWeightError('');
    const weightNum = parseFloat(weight);

    // Strict validation
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
      <View style={[styles.eligibilityCard, { backgroundColor: isEligible ? '#F0FDF4' : '#FFFBEB' }]}>
        <View style={[styles.eligibilityIconBox, { backgroundColor: isEligible ? '#059669' : '#D97706' }]}>
          <Feather name="clock" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.eligibilityTextCol}>
          <Text style={[styles.eligibilityTitle, { color: isEligible ? '#064E3B' : '#92400E' }]}>
            Donation Eligibility Check
          </Text>
          <Text style={[styles.eligibilitySub, { color: isEligible ? '#059669' : '#D97706' }]}>
            {isEligible 
              ? 'Check your donation readiness based on your last recorded donation!' 
              : `Eligible in ${remainingDays} Days (Next Date: ${nextDate?.toISOString().split('T')[0]})`}
          </Text>
        </View>
        
        {isEligible ? (
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#059669' }]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.actionBtnText}>I Donated</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#D97706' }]}>
            <Text style={styles.actionBtnText}>Reminder On</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* --- LOG DONATION MODAL --- */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Your Donation 🩸</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} disabled={logDonationMutation.isPending}>
                <Feather name="x" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Help us determine your next safe donation date using AI.</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Current Weight (kg)</Text>
              <TextInput 
                style={[styles.input, weightError ? { borderColor: '#DC2626' } : null]}
                placeholder="Enter your weight (e.g., 65)"
                placeholderTextColor="#94A3B8"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                editable={!logDonationMutation.isPending}
              />
              {weightError ? <Text style={styles.errorText}>{weightError}</Text> : null}
            </View>

            <View style={styles.formRow}>
              <Text style={styles.label}>Any recent tattoos (last 6 months)?</Text>
              <Switch value={tattoos} onValueChange={setTattoos} disabled={logDonationMutation.isPending} trackColor={{ true: '#DC2626' }} />
            </View>

            <View style={styles.formRow}>
              <Text style={styles.label}>Taken antibiotics (last 48 hours)?</Text>
              <Switch value={antibiotics} onValueChange={setAntibiotics} disabled={logDonationMutation.isPending} trackColor={{ true: '#DC2626' }} />
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, logDonationMutation.isPending && styles.submitBtnDisabled]}
              onPress={handleSubmitDonation}
              disabled={logDonationMutation.isPending}
            >
              {logDonationMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Donation</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- AI INSIGHTS BOTTOM SHEET --- */}
      <Modal animationType="slide" transparent={true} visible={insightsVisible} onRequestClose={() => setInsightsVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { minHeight: 300, backgroundColor: '#F8FAFC' }]}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="sparkles" size={32} color="#8B5CF6" />
              <Text style={[styles.modalTitle, { color: '#6D28D9', marginTop: 8 }]}>Thank You, Hero!</Text>
              <Text style={{ color: '#475569', textAlign: 'center', marginTop: 4, fontFamily: 'Inter_400Regular' }}>
                Here are your personalized AI recovery tips:
              </Text>
            </View>
            
            <View style={styles.aiInsightsContainer}>
              {aiTips.map((tip, index) => (
                <View key={index} style={styles.tipRow}>
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#6D28D9' }]} onPress={() => setInsightsVisible(false)}>
              <Text style={styles.submitBtnText}>Got it, thanks!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 16, paddingHorizontal: 16 },
  // Card Styles
  eligibilityCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  eligibilityIconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  eligibilityTextCol: { flex: 1 },
  eligibilityTitle: { fontSize: 15, fontFamily: 'Inter_800ExtraBold', fontWeight: '800', marginBottom: 4 },
  eligibilitySub: { fontSize: 12, fontFamily: 'Inter_500Medium', fontWeight: '500', lineHeight: 16 },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginLeft: 10 },
  actionBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14, fontFamily: 'Inter_700Bold' },
  // Modal & Form Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', fontFamily: 'Inter_700Bold' },
  modalSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 24, fontFamily: 'Inter_400Regular' },
  formGroup: { marginBottom: 16 },
  formRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  label: { fontSize: 15, color: '#334155', fontWeight: '600', fontFamily: 'Inter_600SemiBold', flex: 1, paddingRight: 16 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 14, fontSize: 16, color: '#0F172A', marginTop: 8, fontFamily: 'Inter_400Regular' },
  errorText: { color: '#DC2626', fontSize: 12, marginTop: 4, fontFamily: 'Inter_500Medium' },
  submitBtn: { backgroundColor: '#DC2626', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter_700Bold' },
  // AI Insights Styles
  aiInsightsContainer: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EDE9FE', marginBottom: 24 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8B5CF6', marginTop: 6, marginRight: 10 },
  tipText: { flex: 1, fontSize: 14, color: '#4C1D95', lineHeight: 20, fontFamily: 'Inter_400Regular' },
});
