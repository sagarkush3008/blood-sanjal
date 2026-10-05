import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Modal, TextInput, Switch, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { DonorsAPI } from '../../api/donors.api';
import { DonationsAPI } from '../../api/donations.api';
import { colors } from '../../theme';

const { width } = Dimensions.get('window');

const useCountdown = (targetDate: string | Date | null) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();
    if (target <= new Date().getTime()) return;

    const interval = setInterval(() => {
      setTick(t => t + 1); // Force re-render every second
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true };

  const target = new Date(targetDate).getTime();
  const distance = target - new Date().getTime();

  if (distance <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true };
  }

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((distance % (1000 * 60)) / 1000),
    isComplete: false,
  };
};

export const EligibilityStatusScreen = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [weight, setWeight] = useState('');
  const [hasTattoos, setHasTattoos] = useState(false);
  const [hasAntibiotics, setHasAntibiotics] = useState(false);
  const [isPregnant, setIsPregnant] = useState(false);
  const [hasSurgery, setHasSurgery] = useState(false);

  // Fetch the latest status via the exact endpoint used for checking profile
  const { data: donorProfile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => DonorsAPI.getMyProfile().then((res) => res.data?.data || res.data).catch(() => null),
  });

  const nextEligibleDate = donorProfile?.inactiveUntil;
  const { days, hours, minutes, seconds, isComplete } = useCountdown(nextEligibleDate);
  const aiTips = donorProfile?.lastRecoveryTips || [];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const assessMutation = useMutation({
    mutationFn: (healthData: any) => DonationsAPI.assessEligibility(healthData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      setModalVisible(false);
      Alert.alert('Assessment Complete', 'Your eligibility status has been updated based on the medical assessment.');
    },
    onError: (error: any) => {
      Alert.alert('Assessment Failed', error.response?.data?.error?.message || 'Something went wrong.');
    }
  });

  const handleAssessSubmit = () => {
    const ageNum = parseInt(age, 10);
    const weightNum = parseFloat(weight);
    
    if (!age || isNaN(ageNum) || ageNum < 18 || ageNum > 65) {
      Alert.alert('Invalid Age', 'Age must be between 18 and 65.');
      return;
    }
    if (!weight || isNaN(weightNum) || weightNum < 45) {
      Alert.alert('Invalid Weight', 'Weight must be at least 45kg.');
      return;
    }

    assessMutation.mutate({
      age: ageNum,
      gender,
      weightKg: weightNum,
      recentTattoos: hasTattoos,
      recentAntibiotics: hasAntibiotics,
      isPregnant,
      hasSurgery,
      lastDonationDate: donorProfile?.lastDonationDate || new Date().toISOString()
    });
  };

  // If there's no inactiveUntil date, they are eligible
  const isEligible = isComplete || !nextEligibleDate;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Impact & Status</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ELIGIBILITY HERO SECTION */}
        {isEligible ? (
          <LinearGradient
            colors={['#059669', '#047857', '#064E3B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard, { paddingVertical: 16 }]}
          >
            <View style={[styles.heroIconBox, { width: 60, height: 60, marginBottom: 12 }]}>
              <MaterialCommunityIcons name="heart-pulse" size={32} color="#FFFFFF" />
            </View>
            <Text style={[styles.heroTitle, { fontSize: 20 }]}>You are ready to save a life!</Text>
            <Text style={[styles.heroSub, { marginBottom: 16 }]}>Your resting period is complete.</Text>
            <TouchableOpacity style={styles.slimBtn} onPress={() => navigation.navigate('FindBlood')} activeOpacity={0.8}>
              <Text style={styles.slimBtnText}>Find Blood Camps</Text>
            </TouchableOpacity>
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={['#DC2626', '#991B1B', '#7F1D1D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard, { paddingVertical: 16 }]}
          >
            <View style={[styles.heroIconBox, { backgroundColor: 'rgba(255,255,255,0.15)', width: 50, height: 50, marginBottom: 8 }]}>
              <MaterialCommunityIcons name="clock-outline" size={28} color="#FFFFFF" />
            </View>
            <Text style={[styles.heroTitle, { fontSize: 18, marginBottom: 4 }]}>Rest & Recover, Hero.</Text>
            <Text style={[styles.heroSub, { marginBottom: 16, fontSize: 12 }]}>Eligible: {new Date(nextEligibleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
            
            <View style={styles.timerContainer}>
              <View style={styles.timeBlock}>
                <Text style={styles.timeVal}>{String(days).padStart(2, '0')}</Text>
                <Text style={styles.timeLabel}>DAYS</Text>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeBlock}>
                <Text style={styles.timeVal}>{String(hours).padStart(2, '0')}</Text>
                <Text style={styles.timeLabel}>HRS</Text>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeBlock}>
                <Text style={styles.timeVal}>{String(minutes).padStart(2, '0')}</Text>
                <Text style={styles.timeLabel}>MIN</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.slimBtn} onPress={() => {}} activeOpacity={0.8}>
              <Feather name="bell" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.slimBtnText}>Remind Me</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        {/* STATS SECTION (Below Red Card) */}
        <View style={styles.statsSection}>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="water" size={28} color="#DC2626" />
            <Text style={styles.statVal}>{donorProfile?.totalDonations || 0}</Text>
            <Text style={styles.statLabel}>Total Donations</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="calendar-check" size={28} color="#059669" />
            <Text style={styles.statVal}>
              {donorProfile?.lastDonationDate 
                ? new Date(donorProfile.lastDonationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Never'}
            </Text>
            <Text style={styles.statLabel}>Last Donated</Text>
          </View>
        </View>

        {/* AI RECOVERY INSIGHTS */}
        {aiTips && aiTips.length > 0 && (
          <View style={styles.aiSection}>
            <Text style={styles.aiTitle}>AI Recovery Insights ✨</Text>
            <View style={styles.aiCard}>
              {aiTips.map((tip: string, index: number) => (
                <View key={index} style={styles.aiTipRow}>
                  <View style={styles.aiTipDot}>
                    <Ionicons name="checkmark" size={14} color="#8B5CF6" />
                  </View>
                  <Text style={styles.aiTipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FLOATING ACTION BUTTON */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.9}>
          <Ionicons name="medical" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.fabText}>Assess New Eligibility</Text>
        </TouchableOpacity>
      </View>

      {/* --- MEDICAL ASSESSMENT MODAL --- */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Medical Assessment</Text>
                <Text style={styles.modalSubtitle}>AI will evaluate your eligibility.</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)} disabled={assessMutation.isPending}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.formRowHoz}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Age</Text>
                  <View style={styles.inputContainer}>
                    <TextInput style={styles.input} placeholder="18-65" placeholderTextColor="#94A3B8" value={age} onChangeText={setAge} keyboardType="numeric" editable={!assessMutation.isPending} />
                  </View>
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                  <Text style={styles.label}>Weight (kg)</Text>
                  <View style={styles.inputContainer}>
                    <TextInput style={styles.input} placeholder="Min 45kg" placeholderTextColor="#94A3B8" value={weight} onChangeText={setWeight} keyboardType="numeric" editable={!assessMutation.isPending} />
                  </View>
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {['MALE', 'FEMALE'].map(g => (
                    <TouchableOpacity 
                      key={g} 
                      style={[styles.genderBtn, gender === g && styles.genderBtnActive]} 
                      onPress={() => setGender(g as any)}
                    >
                      <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Text style={styles.sectionDivider}>Medical History</Text>
              <View style={styles.togglesContainer}>
                {[
                  { label: 'Tattoos in last 6 months', state: hasTattoos, setter: setHasTattoos, icon: 'draw', color: '#DC2626', bg: '#FEF2F2' },
                  { label: 'Antibiotics in last 72 hrs', state: hasAntibiotics, setter: setHasAntibiotics, icon: 'pill', color: '#D97706', bg: '#FFFBEB' },
                  { label: 'Pregnant / Breastfeeding', state: isPregnant, setter: setIsPregnant, icon: 'human-pregnant', color: '#DB2777', bg: '#FDF2F8' },
                  { label: 'Recent major surgery', state: hasSurgery, setter: setHasSurgery, icon: 'hospital-building', color: '#2563EB', bg: '#EFF6FF' },
                ].map((item, idx) => (
                  <View key={idx} style={[styles.toggleRow, idx === 3 && { borderBottomWidth: 0 }]}>
                    <View style={styles.toggleLabelContainer}>
                      <View style={[styles.toggleIconBox, { backgroundColor: item.bg }]}>
                        <MaterialCommunityIcons name={item.icon as any} size={18} color={item.color} />
                      </View>
                      <Text style={styles.toggleLabel}>{item.label}</Text>
                    </View>
                    <Switch value={item.state} onValueChange={item.setter} disabled={assessMutation.isPending} trackColor={{ true: '#DC2626', false: '#E2E8F0' }} thumbColor="#FFFFFF" />
                  </View>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.submitBtn, assessMutation.isPending && styles.submitBtnDisabled]}
                onPress={handleAssessSubmit}
                disabled={assessMutation.isPending}
                activeOpacity={0.8}
              >
                {assessMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Run AI Assessment</Text>
                    <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#0F172A' },
  
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  heroCard: { borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 6 },
  heroIconBox: { borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: 'Inter_900Black', color: '#FFFFFF', textAlign: 'center' },
  heroSub: { fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 },
  
  timerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 20, marginBottom: 16, width: '100%' },
  timeBlock: { alignItems: 'center', width: width * 0.18 },
  timeVal: { fontSize: 28, fontFamily: 'Inter_900Black', color: '#FFFFFF' },
  timeLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', color: '#FCA5A5', marginTop: 2, letterSpacing: 1 },
  timeSeparator: { fontSize: 24, fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.4)', marginHorizontal: 2, paddingBottom: 10 },

  slimBtn: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', width: '100%', height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  slimBtnText: { fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: '#FFFFFF' },

  aiSection: { marginBottom: 24, marginTop: 8 },
  aiTitle: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#0F172A', marginBottom: 12, marginLeft: 4 },
  aiCard: { backgroundColor: '#F8F9FA', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  aiTipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  aiTipDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  aiTipText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', color: '#334155', lineHeight: 20 },

  statsSection: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  statVal: { fontSize: 22, fontFamily: 'Inter_900Black', color: '#0F172A', marginTop: 8, marginBottom: 2 },
  statLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#64748B' },

  fabContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  fab: { backgroundColor: '#DC2626', height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#DC2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  fabText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter_700Bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '92%' },
  dragHandle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  modalTitle: { fontSize: 24, color: '#0F172A', fontFamily: 'Inter_900Black', marginBottom: 4, letterSpacing: -0.5 },
  modalSubtitle: { fontSize: 13, color: '#64748B', fontFamily: 'Inter_500Medium' },
  closeBtn: { padding: 8, backgroundColor: '#F8FAFC', borderRadius: 20 },
  
  formRowHoz: { flexDirection: 'row', justifyContent: 'space-between' },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 13, color: '#475569', fontFamily: 'Inter_600SemiBold', marginBottom: 10, letterSpacing: 0.2 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 16, paddingHorizontal: 16, height: 56 },
  input: { flex: 1, fontSize: 16, color: '#0F172A', fontFamily: 'Inter_600SemiBold', height: '100%' },
  
  genderBtn: { flex: 1, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' },
  genderBtnActive: { backgroundColor: '#0F172A' },
  genderBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#64748B' },
  genderBtnTextActive: { color: '#FFFFFF' },

  sectionDivider: { fontSize: 12, fontFamily: 'Inter_800ExtraBold', color: '#94A3B8', marginTop: 12, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  
  togglesContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 24 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  toggleLabelContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 12 },
  toggleIconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  toggleLabel: { fontSize: 14, color: '#1E293B', fontFamily: 'Inter_600SemiBold', flex: 1 },
  
  submitBtn: { backgroundColor: '#0F172A', height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
