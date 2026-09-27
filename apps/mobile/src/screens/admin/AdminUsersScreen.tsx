import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminAPI } from '../../api/admin.api';
import { colors, spacing, typography } from '../../theme';

export const AdminUsersScreen = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'USERS' | 'DONORS'>('USERS');

  const { data: usersData, isLoading: loadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => AdminAPI.getUsers().then(res => res.data.data || res.data),
    enabled: tab === 'USERS',
  });

  const { data: donorsData, isLoading: loadingDonors, refetch: refetchDonors } = useQuery({
    queryKey: ['admin-donors'],
    queryFn: () => AdminAPI.getDonors().then(res => res.data.data || res.data),
    enabled: tab === 'DONORS',
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => AdminAPI.updateUserStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-donors'] });
      Alert.alert("Success", "User status updated.");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.message || "Failed to update status");
    }
  });

  const verifyDonorMutation = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) => 
      AdminAPI.verifyDonor(id, { isVerified }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-donors'] });
      Alert.alert("Success", "Donor verification status updated.");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.message || "Failed to verify donor.");
    }
  });

  const handleStatusChange = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to change user status to ${newStatus}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => statusMutation.mutate({ id, status: newStatus }) }
      ]
    );
  };

  const handleVerifyDonor = (id: string, currentVerified: boolean) => {
    Alert.alert(
      "Verify Donor",
      `Are you sure you want to ${currentVerified ? 'unverify' : 'verify'} this donor?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => verifyDonorMutation.mutate({ id, isVerified: !currentVerified }) }
      ]
    );
  };

  const isLoading = tab === 'USERS' ? loadingUsers : loadingDonors;
  const listData = tab === 'USERS' 
    ? (Array.isArray(usersData) ? usersData : usersData?.items || usersData?.data || usersData?.results || [])
    : (Array.isArray(donorsData) ? donorsData : donorsData?.items || donorsData?.data || donorsData?.results || []);

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, tab === 'USERS' && styles.activeTab]} onPress={() => setTab('USERS')}>
          <Text style={[styles.tabText, tab === 'USERS' && styles.activeTabText]}>All Users</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'DONORS' && styles.activeTab]} onPress={() => setTab('DONORS')}>
          <Text style={[styles.tabText, tab === 'DONORS' && styles.activeTabText]}>Donors Only</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.danger} style={{ marginTop: spacing.xl }} />
      ) : listData.length === 0 ? (
        <Text style={styles.emptyState}>No records found.</Text>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item._id || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={isLoading}
          onRefresh={tab === 'USERS' ? refetchUsers : refetchDonors}
          renderItem={({ item }) => {
            if (tab === 'DONORS') {
              const u = item.userId || {};
              const donorName = u.name || item.name || 'Donor Profile';
              const email = u.email || item.email || 'Email Protected';
              const isVerified = item.isVerified ?? false;

              return (
                <View style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{donorName}</Text>
                      <View style={[styles.miniBadge, isVerified ? styles.badgeVerified : styles.badgeUnverified]}>
                        <Text style={[styles.miniBadgeText, isVerified ? styles.textVerified : styles.textUnverified]}>
                          {isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.email}>{email}</Text>
                    <Text style={styles.details}>🩸 Blood: <Text style={{ fontWeight: 'bold' }}>{item.bloodGroup}</Text> | Status: {item.donorStatus || 'ACTIVE'}</Text>
                    <Text style={styles.details}>🏆 Donations: {item.totalDonations || 0}</Text>
                  </View>
                  <View style={styles.buttonCol}>
                    <TouchableOpacity 
                      style={[styles.statusButton, isVerified ? styles.unverifyButton : styles.verifyButton]}
                      onPress={() => handleVerifyDonor(item._id, isVerified)}
                    >
                      <Text style={[styles.statusButtonText, isVerified ? styles.unverifyText : styles.verifyText]}>
                        {isVerified ? 'Unverify' : 'Verify'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            return (
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.email}>{item.email}</Text>
                  <Text style={styles.details}>Role: {item.role} | Status: <Text style={{ fontWeight: 'bold' }}>{item.status}</Text></Text>
                </View>
                <TouchableOpacity 
                  style={[styles.statusButton, item.status === 'ACTIVE' ? styles.suspendButton : styles.activateButton]}
                  onPress={() => handleStatusChange(item._id, item.status)}
                >
                  <Text style={[styles.statusButtonText, item.status === 'ACTIVE' ? styles.suspendText : styles.activateText]}>
                    {item.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                  </Text>
                </TouchableOpacity>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.m,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.danger,
  },
  tabText: {
    ...typography.body1,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  activeTabText: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    ...typography.body1,
    fontWeight: 'bold',
    color: colors.text,
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeVerified: {
    backgroundColor: '#ECFDF5',
  },
  badgeUnverified: {
    backgroundColor: '#FEF3C7',
  },
  miniBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  textVerified: {
    color: '#065F46',
  },
  textUnverified: {
    color: '#92400E',
  },
  email: {
    ...typography.caption,
    color: colors.textMuted,
  },
  details: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  buttonCol: {
    gap: 6,
  },
  statusButton: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  suspendButton: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.danger,
  },
  activateButton: {
    backgroundColor: '#ECFDF5',
    borderColor: colors.success,
  },
  verifyButton: {
    backgroundColor: '#ECFDF5',
    borderColor: colors.success,
  },
  unverifyButton: {
    backgroundColor: '#F3F4F6',
    borderColor: colors.border,
  },
  statusButtonText: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  suspendText: {
    color: colors.danger,
  },
  activateText: {
    color: colors.success,
  },
  verifyText: {
    color: colors.success,
  },
  unverifyText: {
    color: colors.textMuted,
  }
});
