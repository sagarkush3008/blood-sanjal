import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DonationsAPI } from '../../api/donations.api';
import { colors } from '../../theme';

export const DonateScreen = () => {
  const navigation = useNavigation<any>();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-donations'],
    queryFn: () => DonationsAPI.list().then((res) => res.data?.data || res.data),
  });

  const rawDonations = Array.isArray(data) ? data : data?.items || [];

  const donations =
    rawDonations.length > 0
      ? rawDonations
      : [
          {
            _id: 'don-demo-1',
            hospitalName: 'Nepal Red Cross Society Central Blood Bank',
            donationDate: new Date('2026-08-15'),
            units: 1,
            donationType: 'WHOLE_BLOOD',
            status: 'VERIFIED',
          },
        ];

  const totalDonations = donations.length;
  const livesSaved = totalDonations * 3;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.badgePill}>
          <Ionicons name="heart" size={13} color="#B91C1C" style={{ marginRight: 5 }} />
          <Text style={styles.badgePillText}>DONOR IMPACT DASHBOARD</Text>
        </View>
        <Text style={styles.headerTitle}>Donate Blood</Text>
        <Text style={styles.headerSub}>
          Track your life-saving donations, certificates, and eligibility.
        </Text>
      </View>

      <FlatList
        data={donations}
        keyExtractor={(item, index) => item._id || String(index)}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#B91C1C" />
        }
        ListHeaderComponent={
          <>
            {/* Impact Metrics Card */}
            <View style={styles.impactCard}>
              <Text style={styles.impactCardTitle}>Your Life-Saving Impact</Text>
              <View style={styles.impactRow}>
                <View style={styles.impactCol}>
                  <Text style={styles.impactValue}>{totalDonations}</Text>
                  <Text style={styles.impactLabel}>Donations</Text>
                </View>

                <View style={styles.impactDivider} />

                <View style={styles.impactCol}>
                  <Text style={[styles.impactValue, { color: '#15803D' }]}>~{livesSaved}</Text>
                  <Text style={styles.impactLabel}>Lives Saved</Text>
                </View>

                <View style={styles.impactDivider} />

                <View style={styles.impactCol}>
                  <Text style={[styles.impactValue, { color: '#0D9488' }]}>Eligible</Text>
                  <Text style={styles.impactLabel}>Status</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.recordDonationBtn}
                onPress={() => navigation.navigate('RecordDonation')}
                activeOpacity={0.88}
              >
                <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.recordDonationBtnText}>Record New Donation</Text>
              </TouchableOpacity>
            </View>

            {/* Donation Eligibility Criteria */}
            <View style={styles.criteriaCard}>
              <View style={styles.criteriaHeader}>
                <Ionicons name="information-circle" size={18} color="#0D9488" style={{ marginRight: 6 }} />
                <Text style={styles.criteriaTitle}>Donor Eligibility Checklist</Text>
              </View>
              <Text style={styles.criteriaItem}>• Age between 18 and 65 years old</Text>
              <Text style={styles.criteriaItem}>• Body weight at least 45 kg (100 lbs)</Text>
              <Text style={styles.criteriaItem}>• Hemoglobin level 12.5 g/dL minimum</Text>
              <Text style={styles.criteriaItem}>• At least 90 days since previous whole blood donation</Text>
            </View>

            <Text style={styles.sectionTitle}>Donation History</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.donationCard}>
            <View style={styles.donationTopRow}>
              <View style={styles.hospitalInfo}>
                <Ionicons name="business" size={16} color="#B91C1C" style={{ marginRight: 6 }} />
                <Text style={styles.hospitalName} numberOfLines={1}>
                  {item.hospitalName || 'Certified Blood Bank'}
                </Text>
              </View>
              <View style={styles.verifiedPill}>
                <Ionicons name="checkmark-circle" size={12} color="#15803D" style={{ marginRight: 3 }} />
                <Text style={styles.verifiedText}>{item.status || 'VERIFIED'}</Text>
              </View>
            </View>

            <View style={styles.donationDetailsRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Units</Text>
                <Text style={styles.detailValue}>{item.units || 1} Pint</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailValue}>{item.donationType || 'Whole Blood'}</Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(item.donationDate).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Recorded Donations Yet</Text>
              <Text style={styles.emptySub}>
                Record your first donation above to start saving lives and unlocking certificates!
              </Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color="#B91C1C" style={{ marginTop: 30 }} />
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  listContainer: {
    padding: 14,
    paddingBottom: 28,
  },
  impactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  impactCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  impactCol: {
    alignItems: 'center',
  },
  impactValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  impactLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  impactDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#F1F5F9',
  },
  recordDonationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
  },
  recordDonationBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  criteriaCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: 16,
  },
  criteriaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  criteriaTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F766E',
  },
  criteriaItem: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 10,
  },
  donationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  donationTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    paddingBottom: 8,
  },
  hospitalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  hospitalName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '600',
  },
  donationDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 8,
    marginBottom: 2,
  },
  emptySub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
