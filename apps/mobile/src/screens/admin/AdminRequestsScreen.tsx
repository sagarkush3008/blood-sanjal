import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminAPI } from '../../api/admin.api';
import { colors, spacing, typography } from '../../theme';

export const AdminRequestsScreen = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'ALL' | 'PENDING_VERIFICATION' | 'ACTIVE' | 'FULFILLED'>('ALL');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-blood-requests', filter],
    queryFn: () => {
      const params: any = {};
      if (filter !== 'ALL') params.status = filter;
      return AdminAPI.getBloodRequests(params).then(res => res.data.data || res.data);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, activate }: { id: string; activate: boolean }) => 
      AdminAPI.verifyBloodRequest(id, { activate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blood-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      Alert.alert("Verified", "The blood request has been clinically verified and activated.");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.message || "Verification failed.");
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      AdminAPI.updateBloodRequestStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blood-requests'] });
      Alert.alert("Status Updated", "Request status updated.");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.message || "Failed to update status.");
    }
  });

  const handleVerify = (id: string) => {
    Alert.alert(
      "Verify & Activate",
      "Do you clinically verify the medical requirement and want to activate this request for donor matching?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Activate", onPress: () => verifyMutation.mutate({ id, activate: true }) }
      ]
    );
  };

  const handleClose = (id: string) => {
    Alert.alert(
      "Close Request",
      "Mark this blood request as fulfilled/closed?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Close", onPress: () => statusMutation.mutate({ id, status: 'FULFILLED' }) }
      ]
    );
  };

  const requests = data?.items || data?.data || data?.results || (Array.isArray(data) ? data : []);

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        {(['ALL', 'PENDING_VERIFICATION', 'ACTIVE', 'FULFILLED'] as const).map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.filterTabText, filter === tab && styles.filterTabTextActive]}>
              {tab === 'PENDING_VERIFICATION' ? 'Pending' : tab === 'ALL' ? 'All' : tab === 'ACTIVE' ? 'Active' : 'Closed'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : requests.length === 0 ? (
        <Text style={styles.emptyState}>No blood requests found for this filter.</Text>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={isLoading}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.headerRow}>
                <View style={styles.bloodChip}>
                  <Text style={styles.bloodChipText}>{item.bloodGroup}</Text>
                </View>
                <View style={[styles.statusBadge, item.status === 'ACTIVE' ? styles.badgeActive : item.status === 'PENDING_VERIFICATION' ? styles.badgePending : styles.badgeClosed]}>
                  <Text style={[styles.statusBadgeText, item.status === 'ACTIVE' ? styles.textActive : item.status === 'PENDING_VERIFICATION' ? styles.textPending : styles.textClosed]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.patientName}>Patient: {item.patientName || 'Medical Case'}</Text>
              <Text style={styles.hospitalText}>🏥 {item.hospitalName}</Text>
              <Text style={styles.unitsText}>🩸 Needed: {item.unitsRequired} Unit(s) (Fulfilled: {item.unitsFulfilled || 0})</Text>
              <Text style={styles.urgencyText}>⚡ Urgency: <Text style={{ fontWeight: 'bold' }}>{item.urgency}</Text></Text>

              <View style={styles.actionRow}>
                {item.status === 'PENDING_VERIFICATION' && (
                  <TouchableOpacity style={[styles.actionBtn, styles.verifyBtn]} onPress={() => handleVerify(item._id)}>
                    <Text style={styles.verifyBtnText}>Verify & Activate</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'ACTIVE' && (
                  <TouchableOpacity style={[styles.actionBtn, styles.closeBtn]} onPress={() => handleClose(item._id)}>
                    <Text style={styles.closeBtnText}>Mark Fulfilled</Text>
                  </TouchableOpacity>
                )}
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
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.s,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#FEE2E2',
  },
  filterTabText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  filterTabTextActive: {
    color: colors.danger,
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
    borderRadius: 12,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  bloodChip: {
    backgroundColor: colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bloodChipText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeActive: {
    backgroundColor: '#ECFDF5',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgeClosed: {
    backgroundColor: '#F3F4F6',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  textActive: {
    color: '#065F46',
  },
  textPending: {
    color: '#92400E',
  },
  textClosed: {
    color: '#4B5563',
  },
  patientName: {
    ...typography.body1,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  hospitalText: {
    ...typography.body2,
    color: colors.primaryDark,
    marginBottom: 2,
  },
  unitsText: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  urgencyText: {
    ...typography.caption,
    color: colors.text,
    marginBottom: spacing.s,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.s,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.s,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.s,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: colors.success,
  },
  verifyBtnText: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.success,
  },
  closeBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  closeBtnText: {
    ...typography.caption,
    fontWeight: 'bold',
    color: '#1D4ED8',
  }
});
