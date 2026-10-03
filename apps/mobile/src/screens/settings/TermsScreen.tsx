import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LegalAPI } from '../../api/legal.api';
import { colors } from '../../theme';

export const TermsScreen = () => {
  const navigation = useNavigation<any>();

  const { data, isLoading } = useQuery({
    queryKey: ['legal-terms'],
    queryFn: async () => {
      const res = await LegalAPI.getTerms();
      return res.data?.data || res.data;
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{data?.title || 'Terms of Service'}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>
          Effective Date: {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleDateString() : 'January 1, 2026'}
        </Text>

        {data?.content ? (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Official Policy Summary</Text>
            <Text style={styles.summaryText}>{data.content}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionHeading}>1. Purpose of Blood Sanjal</Text>
        <Text style={styles.bodyText}>
          Blood Sanjal is a humanitarian platform connecting voluntary blood donors with verified patients,
          hospitals, and certified blood transfusion centers across Nepal. Blood Sanjal is not a blood bank
          and does not buy, sell, store, or physically process human blood.
        </Text>

        <Text style={styles.sectionHeading}>2. Voluntary and Non-Commercial Use</Text>
        <Text style={styles.bodyText}>
          Commercialization of human blood or solicitation of financial consideration for blood donation
          is strictly prohibited by the Laws of Nepal and platform policies. Any user attempting to sell
          blood or charge emergency patients will be immediately banned and reported to relevant authorities.
        </Text>

        <Text style={styles.sectionHeading}>3. Verification & Accuracy of Requests</Text>
        <Text style={styles.bodyText}>
          Users submitting emergency blood requests represent and warrant that the clinical details,
          hospital admission information, and patient requirements are accurate. Malicious, frivolous,
          or fraudulent blood requests are strictly prohibited.
        </Text>

        <Text style={styles.sectionHeading}>4. Emergency Broadcasts</Text>
        <Text style={styles.bodyText}>
          Emergency broadcast notifications are moderated and verified by platform administrators
          to prevent panic, spam, and resource exhaustion.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#0F172A' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  lastUpdated: { fontSize: 12, color: '#64748B', marginBottom: 16 },
  summaryBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#991B1B',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 18,
  },
  sectionHeading: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#0F172A', marginTop: 14, marginBottom: 6 },
  bodyText: { fontSize: 13, color: '#475569', lineHeight: 20 },
});
