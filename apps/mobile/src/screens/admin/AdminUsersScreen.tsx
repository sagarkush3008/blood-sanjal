import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminAPI } from '../../api/admin.api';
import { colors, spacing, typography } from '../../theme';

export const AdminUsersScreen = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'USERS' | 'DONORS'>('USERS');

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => AdminAPI.getUsers().then(res => res.data.data || res.data),
    enabled: tab === 'USERS',
  });

  const { data: donorsData, isLoading: loadingDonors } = useQuery({
    queryKey: ['admin-donors'],
    queryFn: () => AdminAPI.getDonors().then(res => res.data.data || res.data),
    enabled: tab === 'DONORS',
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => AdminAPI.updateUserStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-donors'] });
      Alert.alert("Success", "User status updated.");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.message || "Failed to update status");
    }
  });

  const handleStatusChange = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to change status to ${newStatus}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => statusMutation.mutate({ id, status: newStatus }) }
      ]
    );
  };

  const isLoading = tab === 'USERS' ? loadingUsers : loadingDonors;
  const listData = tab === 'USERS' 
    ? (Array.isArray(usersData) ? usersData : usersData?.items || [])
    : (Array.isArray(donorsData) ? donorsData : donorsData?.items || []);

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
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.details}>Role: {item.role} | Status: {item.status}</Text>
                {tab === 'DONORS' && <Text style={styles.details}>Blood: {item.bloodGroup} | City: {item.cityId}</Text>}
              </View>
              <TouchableOpacity 
                style={[styles.statusButton, item.status === 'ACTIVE' ? styles.suspendButton : styles.activateButton]}
                onPress={() => handleStatusChange(item._id, item.status)}
              >
                <Text style={styles.statusButtonText}>{item.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</Text>
              </TouchableOpacity>
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
    borderRadius: 8,
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    ...typography.body1,
    fontWeight: 'bold',
    color: colors.text,
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
  statusButton: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 6,
  },
  suspendButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  activateButton: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: colors.success,
  },
  statusButtonText: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.text,
  }
});
