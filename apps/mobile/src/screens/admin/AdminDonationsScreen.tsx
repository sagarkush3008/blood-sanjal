import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DonationsAPI } from '../../api/donations.api';
import { colors, spacing, typography } from '../../theme';

export const AdminDonationsScreen = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-donations'],
    queryFn: () => DonationsAPI.list().then(res => res.data.data || res.data),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, action }: { id: string, action: string }) => DonationsAPI.updateStatus(id, { action, reason: '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-donations'] });
      Alert.alert("Success", "Donation record updated.");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.message || "Failed to verify donation.");
    }
  });

  const handleVerify = (id: string, action: string) => {
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to mark this as ${action}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => verifyMutation.mutate({ id, action }) }
      ]
    );
  };

  const records = data?.results || (Array.isArray(data) ? data : data?.items || []);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : records.length === 0 ? (
        <Text style={styles.emptyState}>No donation records found.</Text>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item._id || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.hospitalName}>{item.hospitalName}</Text>
                <Text style={styles.details}>Date: {new Date(item.donationDate).toLocaleDateString()}</Text>
                <Text style={styles.details}>Location: {item.location}</Text>
                <Text style={styles.details}>Status: <Text style={{ fontWeight: 'bold' }}>{item.verificationStatus}</Text></Text>
              </View>
              {item.verificationStatus === 'PENDING' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleVerify(item._id, 'REJECTED')}
                  >
                    <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.verifyButton]}
                    onPress={() => handleVerify(item._id, 'VERIFIED')}
                  >
                    <Text style={styles.verifyText}>Verify</Text>
                  </TouchableOpacity>
                </View>
              )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hospitalName: {
    ...typography.body1,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 4,
  },
  details: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  actionRow: {
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: '#ECFDF5',
    borderColor: colors.success,
  },
  rejectButton: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.danger,
  },
  verifyText: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.success,
  },
  rejectText: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.danger,
  }
});
