import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AdminAPI } from '../../api/admin.api';
import { colors, spacing, typography } from '../../theme';

export const AdminAuditScreen = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => AdminAPI.getAuditLogs().then(res => res.data.data || res.data),
  });

  const logs = Array.isArray(data) ? data : data?.items || [];

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.danger} style={{ marginTop: spacing.xl }} />
      ) : logs.length === 0 ? (
        <Text style={styles.emptyState}>No audit logs found.</Text>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item._id || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={isLoading}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.action}>{item.action}</Text>
                <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
              <Text style={styles.adminEmail}>Admin: {item.adminId?.email || item.adminId || 'System'}</Text>
              <Text style={styles.details}>
                Target: {item.targetModel} ({item.targetId})
              </Text>
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
  },
  listContainer: {
    padding: spacing.m,
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
    borderRadius: 8,
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
  action: {
    ...typography.body1,
    fontWeight: 'bold',
    color: colors.danger,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
  },
  adminEmail: {
    ...typography.body2,
    color: colors.text,
  },
  details: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  }
});
