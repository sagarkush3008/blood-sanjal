import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { DonorsAPI } from '../../api/donors.api';
import { colors } from '../../theme';

const { width } = Dimensions.get('window');

const useCountdown = (targetDate: string | Date | null) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isComplete: true,
  });

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
        isComplete: false,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
};

export const EligibilityStatusScreen = () => {
  const navigation = useNavigation<any>();

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
            style={styles.heroCard}
          >
            <View style={styles.heroIconBox}>
              <MaterialCommunityIcons name="heart-pulse" size={60} color="#FFFFFF" />
            </View>
            <Text style={styles.heroTitle}>You are ready to save a life!</Text>
            <Text style={styles.heroSub}>Your resting period is complete. Hospitals and patients in your area need your help.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('FindBlood')} activeOpacity={0.8}>
              <Text style={styles.primaryBtnText}>Find Blood Camps</Text>
            </TouchableOpacity>
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={['#DC2626', '#991B1B', '#7F1D1D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={[styles.heroIconBox, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <MaterialCommunityIcons name="clock-outline" size={50} color="#FFFFFF" />
            </View>
            <Text style={styles.heroTitle}>Rest & Recover, Hero.</Text>
            <Text style={styles.heroSub}>Next eligible date: {new Date(nextEligibleDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
            
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
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeBlock}>
                <Text style={styles.timeVal}>{String(seconds).padStart(2, '0')}</Text>
                <Text style={styles.timeLabel}>SEC</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={() => {}} activeOpacity={0.8}>
              <Feather name="bell" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Remind Me When Eligible</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        {/* AI RECOVERY INSIGHTS */}
        {aiTips && aiTips.length > 0 && (
          <View style={styles.aiSection}>
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={24} color="#8B5CF6" />
              <Text style={styles.aiTitle}>AI Recovery Insights ✨</Text>
            </View>
            
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

        {/* STATS SECTION */}
        <View style={styles.statsSection}>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="water" size={32} color="#DC2626" />
            <Text style={styles.statVal}>{donorProfile?.totalDonations || 0}</Text>
            <Text style={styles.statLabel}>Total Donations</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="calendar-check" size={32} color="#059669" />
            <Text style={styles.statVal}>
              {donorProfile?.lastDonationDate 
                ? new Date(donorProfile.lastDonationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                : 'Never'}
            </Text>
            <Text style={styles.statLabel}>Last Donated</Text>
          </View>
        </View>

      </ScrollView>
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
  
  heroCard: { borderRadius: 28, padding: 24, alignItems: 'center', marginBottom: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  heroIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  heroTitle: { fontSize: 24, fontFamily: 'Inter_900Black', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  heroSub: { fontSize: 14, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: 32, lineHeight: 22, paddingHorizontal: 10 },
  
  timerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)', paddingVertical: 20, paddingHorizontal: 12, borderRadius: 24, marginBottom: 32, width: '100%' },
  timeBlock: { alignItems: 'center', width: width * 0.16 },
  timeVal: { fontSize: 32, fontFamily: 'Inter_900Black', color: '#FFFFFF' },
  timeLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#FCA5A5', marginTop: 4, letterSpacing: 1 },
  timeSeparator: { fontSize: 28, fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.4)', marginHorizontal: 4, paddingBottom: 12 },

  primaryBtn: { flexDirection: 'row', backgroundColor: '#FFFFFF', width: '100%', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  primaryBtnText: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#0F172A' },

  aiSection: { marginBottom: 32 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  aiTitle: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#8B5CF6', marginLeft: 8 },
  aiCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#EDE9FE', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  aiTipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  aiTipDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 },
  aiTipText: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: '#4C1D95', lineHeight: 22 },

  statsSection: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  statBox: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  statVal: { fontSize: 24, fontFamily: 'Inter_900Black', color: '#0F172A', marginTop: 12, marginBottom: 4 },
  statLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#64748B' },
});
