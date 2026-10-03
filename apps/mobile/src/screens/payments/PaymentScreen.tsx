import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { PaymentsAPI } from '../../api/payments.api';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing } from '../../theme';

const PAYMENT_PROVIDERS = [
  {
    id: 'KHALTI',
    name: 'Khalti Digital Wallet',
    tagline: 'Instant wallet transfer',
    icon: 'wallet',
    accentColor: '#5C2D91',
    bg: '#F5EEF8',
  },
  {
    id: 'ESEWA',
    name: 'eSewa Mobile Wallet',
    tagline: 'Nepal’s pioneer digital wallet',
    icon: 'card',
    accentColor: '#60BB46',
    bg: '#F0F9EE',
  },
  {
    id: 'CONNECT_IPS',
    name: 'ConnectIPS',
    tagline: 'Direct bank account transfer',
    icon: 'business',
    accentColor: '#2B579A',
    bg: '#EDF2F9',
  },
];

export const PaymentScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();

  const purpose = route.params?.purpose || 'SEARCH_FEE';
  const amount = route.params?.amount || 50;

  const [selectedProvider, setSelectedProvider] = useState('KHALTI');

  // Authoritative Search Fee Payment Mutation
  const paymentMutation = useMutation({
    mutationFn: async () => {
      // Initiates search fee and performs authoritative webhook verification
      return PaymentsAPI.confirmMockSearchFee();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-history'] });
      queryClient.invalidateQueries({ queryKey: ['search-fee-status'] });
      Alert.alert(
        'Payment Completed! 💳',
        `NPR ${amount} platform search fee successfully verified. You now have unrestricted access to contact matching blood donors.`,
        [
          {
            text: 'Continue',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    },
    onError: (err: any) => {
      Alert.alert(
        'Payment Failed',
        err.response?.data?.error?.message || err.response?.data?.message || 'Could not complete payment.'
      );
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Payment</Text>
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => navigation.navigate('PaymentHistory')}
          activeOpacity={0.7}
        >
          <Ionicons name="receipt-outline" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Bill Summary Card */}
        <View style={styles.billCard}>
          <Text style={styles.billLabel}>AMOUNT PAYABLE</Text>
          <Text style={styles.billAmount}>NPR {amount}.00</Text>
          <View style={styles.purposePill}>
            <Ionicons name="lock-closed" size={12} color={colors.primary} />
            <Text style={styles.purposeText}>
              {purpose === 'SEARCH_FEE' ? 'Donor Registry Search Fee' : 'Voluntary Support'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.billDetailRow}>
            <Text style={styles.billDetailLabel}>Service</Text>
            <Text style={styles.billDetailVal}>Donor Contact Search Access</Text>
          </View>

          <View style={styles.billDetailRow}>
            <Text style={styles.billDetailLabel}>Access Duration</Text>
            <Text style={styles.billDetailVal}>Active Request Session</Text>
          </View>

          <View style={styles.billDetailRow}>
            <Text style={styles.billDetailLabel}>Currency</Text>
            <Text style={styles.billDetailVal}>NPR (Nepalese Rupee)</Text>
          </View>
        </View>

        {/* Payment Gateways Selection */}
        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        <View style={styles.providerList}>
          {PAYMENT_PROVIDERS.map((provider) => {
            const isSelected = selectedProvider === provider.id;
            return (
              <TouchableOpacity
                key={provider.id}
                style={[
                  styles.providerCard,
                  isSelected && styles.providerCardActive,
                ]}
                onPress={() => setSelectedProvider(provider.id)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.providerIconContainer,
                    { backgroundColor: provider.bg },
                  ]}
                >
                  <Ionicons
                    name={provider.icon as any}
                    size={22}
                    color={provider.accentColor}
                  />
                </View>

                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{provider.name}</Text>
                  <Text style={styles.providerTagline}>{provider.tagline}</Text>
                </View>

                <View
                  style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleActive,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Security & Regulatory Notice */}
        <View style={styles.securityBox}>
          <Ionicons name="shield-checkmark" size={18} color="#059669" />
          <View style={{ flex: 1 }}>
            <Text style={styles.securityTitle}>Bank-Grade Authoritative Settlement</Text>
            <Text style={styles.securityText}>
              Transactions are signed and verified authoritatively with provider webhooks. Your
              financial data is never stored on Blood Sanjal mobile devices.
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <View style={{ marginTop: spacing.l }}>
          <PrimaryButton
            title={`Pay NPR ${amount}.00 via ${
              PAYMENT_PROVIDERS.find((p) => p.id === selectedProvider)?.name.split(' ')[0]
            }`}
            icon="card-outline"
            onPress={() => paymentMutation.mutate()}
            loading={paymentMutation.isPending}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  historyBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  billLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  billAmount: {
    fontSize: 32,
    fontFamily: 'Inter_900Black',
    color: '#0F172A',
    marginVertical: 4,
  },
  purposePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginTop: 2,
  },
  purposeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  billDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  billDetailLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  billDetailVal: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#0F172A',
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  providerList: {
    gap: 10,
    marginBottom: 16,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  providerCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFFDFD',
  },
  providerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  providerTagline: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 8,
  },
  securityTitle: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#166534',
  },
  securityText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
    marginTop: 2,
  },
});
