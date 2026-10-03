import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminAPI } from '../../api/admin.api';
import { colors, spacing, typography } from '../../theme';

export const AdminPaymentsScreen = () => {
  const queryClient = useQueryClient();

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['admin-payments-summary'],
    queryFn: () => AdminAPI.getPaymentSummary().then(res => res.data.data || res.data),
  });

  const { data: txList, isLoading: loadingTx, refetch } = useQuery({
    queryKey: ['admin-payments-list'],
    queryFn: () => AdminAPI.getPayments().then(res => res.data.data || res.data),
  });

  const refundMutation = useMutation({
    mutationFn: (id: string) => AdminAPI.refundPayment(id, 'Admin initiated refund from portal'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payments-list'] });
      Alert.alert("Refund Processed", "The payment has been marked as refunded.");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.message || "Refund failed.");
    }
  });

  const handleRefund = (id: string, gatewayTxId: string) => {
    Alert.alert(
      "Confirm Refund",
      `Are you sure you want to refund transaction ${gatewayTxId || id}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Refund", style: "destructive", onPress: () => refundMutation.mutate(id) }
      ]
    );
  };

  const isLoading = loadingSummary || loadingTx;
  const transactions = txList?.items || txList?.data || txList?.results || (Array.isArray(txList) ? txList : []);
  const revenueNpr = summary?.totalRevenueNPR ?? (summary?.totalRevenueMinor ? Math.round(summary.totalRevenueMinor / 100) : 0);
  const totalCount = summary?.totalCount ?? summary?.count ?? transactions.length;

  return (
    <View style={styles.container}>
      {/* Revenue KPI Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Total Platform Revenue</Text>
            <Text style={styles.summaryValue}>NPR {revenueNpr.toLocaleString()}</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{totalCount} Txns</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Transaction Ledger</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : transactions.length === 0 ? (
        <Text style={styles.emptyState}>No transactions recorded yet.</Text>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item._id || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={isLoading}
          onRefresh={refetch}
          renderItem={({ item }) => {
            const amountNpr = item.amountMinor ? (item.amountMinor / 100).toFixed(2) : '0.00';
            const isSuccess = item.status === 'SUCCESS';

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.purposeText}>{item.purpose?.replace(/_/g, ' ') || 'SEARCH PLATFORM FEE'}</Text>
                  <View style={[styles.statusBadge, isSuccess ? styles.badgeSuccess : styles.badgeOther]}>
                    <Text style={[styles.statusText, isSuccess ? styles.textSuccess : styles.textOther]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.amountRow}>
                  <Text style={styles.amountText}>NPR {amountNpr}</Text>
                  <Text style={styles.dateText}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</Text>
                </View>

                <Text style={styles.refText}>Ref: {item.gatewayTransactionId || item.gatewayTxId || item._id}</Text>
                <Text style={styles.gatewayText}>Provider: {item.gateway || 'DIGITAL WALLET'}</Text>

                {isSuccess && (
                  <TouchableOpacity 
                    style={styles.refundBtn} 
                    onPress={() => handleRefund(item._id, item.gatewayTransactionId)}
                    disabled={refundMutation.isPending}
                  >
                    <Text style={styles.refundBtnText}>Initiate Refund</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    padding: spacing.l,
    margin: spacing.m,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontFamily: 'Inter_700Bold',
  },
  summaryValue: {
    ...typography.h1,
    color: colors.primaryDark,
    marginTop: 4,
  },
  countBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  countText: {
    ...typography.caption,
    fontFamily: 'Inter_700Bold',
    color: colors.success,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    paddingHorizontal: spacing.m,
    marginBottom: spacing.s,
  },
  listContainer: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.l,
  },
  emptyState: {
    ...typography.body1,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  purposeText: {
    ...typography.body2,
    fontFamily: 'Inter_700Bold',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeSuccess: {
    backgroundColor: '#ECFDF5',
  },
  badgeOther: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  textSuccess: {
    color: '#065F46',
  },
  textOther: {
    color: '#92400E',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  amountText: {
    ...typography.h3,
    color: colors.primaryDark,
  },
  dateText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  refText: {
    ...typography.caption,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  gatewayText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  refundBtn: {
    marginTop: spacing.s,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.m,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2',
  },
  refundBtnText: {
    ...typography.caption,
    fontFamily: 'Inter_700Bold',
    color: colors.danger,
  }
});
