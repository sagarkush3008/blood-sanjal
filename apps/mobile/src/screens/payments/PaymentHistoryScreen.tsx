import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentsAPI } from '../../api/payments.api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { colors } from '../../theme';

export const PaymentHistoryScreen = () => {
  const navigation = useNavigation<any>();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => PaymentsAPI.getHistory().then((res) => res.data?.data || res.data),
  });

  const transactions: any[] = Array.isArray(data)
    ? data
    : data?.items || data?.results || (Array.isArray(data?.data) ? data.data : []);

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
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item._id || item.transactionId || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => {
          const dateStr = new Date(item.createdAt || item.timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          const isSuccess =
            item.status === 'COMPLETED' || item.status === 'SUCCESS' || item.paymentStatus === 'PAID';

          return (
            <View style={styles.txCard}>
              <View style={styles.txTopRow}>
                <View style={styles.txIconContainer}>
                  <Ionicons
                    name={isSuccess ? 'checkmark-circle' : 'receipt-outline'}
                    size={20}
                    color={isSuccess ? '#059669' : colors.primary}
                  />
                </View>

                <View style={styles.txMainInfo}>
                  <Text style={styles.txPurpose}>
                    {item.purpose?.replace(/_/g, ' ') || 'Search Access Fee'}
                  </Text>
                  <Text style={styles.txDate}>{dateStr}</Text>
                </View>

                <View style={styles.txAmountCol}>
                  <Text style={styles.txAmount}>
                    NPR {item.amount || item.amountPaid || '50'}
                  </Text>
                  <StatusBadge status={item.status || 'SUCCESS'} />
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.txBottomRow}>
                <View style={styles.txMetaItem}>
                  <Text style={styles.txMetaLabel}>Provider</Text>
                  <Text style={styles.txMetaVal}>{item.provider || 'KHALTI'}</Text>
                </View>

                <View style={styles.txMetaItem}>
                  <Text style={styles.txMetaLabel}>Ref / ID</Text>
                  <Text style={styles.txMetaVal} numberOfLines={1}>
                    {item.gatewayTransactionId || item.transactionId || item._id?.slice(-8)}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: 12 }}>
              <SkeletonCard height={95} />
              <SkeletonCard height={95} />
            </View>
          ) : (
            <EmptyState
              icon="receipt-outline"
              title="No Payment History"
              description="You have no recorded transactions. Search fee settlements and receipts will be logged here."
            />
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
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  txCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  txTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  txMainInfo: {
    flex: 1,
  },
  txPurpose: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  txDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  txAmountCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontSize: 14,
    fontFamily: 'Inter_800ExtraBold',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  txBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txMetaLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  txMetaVal: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#334155',
  },
});
