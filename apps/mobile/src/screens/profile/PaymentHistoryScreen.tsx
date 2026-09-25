import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { PaymentsAPI } from '../../api/payments.api';
import { colors, spacing, typography } from '../../theme';

export const PaymentHistoryScreen = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => PaymentsAPI.getHistory().then(res => res.data.data || res.data),
  });

  if (isLoading) {
    return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />;
  }

  const history = Array.isArray(data) ? data : data?.items || [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contribution History</Text>
      <Text style={styles.subtitle}>A record of your support to Blood Sanjal.</Text>

      {history.length === 0 ? (
        <Text style={styles.emptyText}>You haven't made any contributions yet.</Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item._id || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.amount}>Rs. {item.amount}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={[styles.badge, item.status === 'COMPLETED' ? styles.badgeSuccess : styles.badgePending]}>
                <Text style={[styles.badgeText, item.status === 'COMPLETED' ? styles.badgeTextSuccess : styles.badgeTextPending]}>
                  {item.status}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.l,
  },
  title: {
    ...typography.h2,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body1,
    color: colors.textMuted,
    marginBottom: spacing.l,
  },
  emptyText: {
    ...typography.body1,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 8,
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amount: {
    ...typography.body1,
    fontWeight: 'bold',
    color: colors.text,
  },
  date: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: colors.success,
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  badgeText: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  badgeTextSuccess: {
    color: colors.success,
  },
  badgeTextPending: {
    color: '#92400E',
  }
});
