import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LegalAPI } from '../../api/legal.api';
import { colors } from '../../theme';

export const PrivacyPolicyScreen = () => {
  const navigation = useNavigation<any>();

  const { data } = useQuery({
    queryKey: ['legal-privacy-policy'],
    queryFn: async () => {
      const res = await LegalAPI.getPrivacyPolicy();
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
        <Text style={styles.headerTitle}>{data?.title || 'Privacy Policy'}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>
          Effective Date: {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleDateString() : 'January 1, 2026'}
        </Text>

        {data?.content ? (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Official Privacy Commitment</Text>
            <Text style={styles.summaryText}>{data.content}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionHeading}>1. Our Commitment to Donor Privacy</Text>
        <Text style={styles.bodyText}>
          Blood Sanjal implements privacy-by-design principles. Donor personal identifiable information
          (phone number, email, GPS coordinates, residential address) is masked and encrypted.
        </Text>

        <Text style={styles.sectionHeading}>2. Two-Way Consent Workflow</Text>
        <Text style={styles.bodyText}>
          Recipient searches will NEVER expose donor contact information directly. When a recipient
          submits a contact request, the donor receives an in-app prompt. Phone numbers are revealed
          ONLY if the donor explicitly accepts the request.
        </Text>

        <Text style={styles.sectionHeading}>3. Location Data Protection</Text>
        <Text style={styles.bodyText}>
          We display approximate municipality / ward-level locations to donors and recipients to protect
          donor safety. Exact geographic GPS coordinates are never made public.
        </Text>

        <Text style={styles.sectionHeading}>4. Financial & Payment Privacy</Text>
        <Text style={styles.bodyText}>
          Payment transactions are processed directly with authorized Nepalese payment providers
          (Khalti, eSewa, ConnectIPS). No sensitive credit card or banking credentials are saved on
          Blood Sanjal servers.
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
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 18,
  },
  sectionHeading: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#0F172A', marginTop: 14, marginBottom: 6 },
  bodyText: { fontSize: 13, color: '#475569', lineHeight: 20 },
});
