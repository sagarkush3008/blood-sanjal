import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminAPI } from '../../api/admin.api';
import { colors, spacing, typography } from '../../theme';

export const AdminDonationsScreen = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-donations'],
    queryFn: () => AdminAPI.getDonations().then(res => res.data.data || res.data),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'VERIFIED' | 'REJECTED' }) => 
      AdminAPI.verifyDonation(id, { status, reason: status === 'REJECTED' ? 'Did not meet clinical criteria' : undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-donations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      Alert.alert("Success", "Donation verification status updated.");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.message || "Failed to verify donation.");
    }
  });

  const certMutation = useMutation({
    mutationFn: (id: string) => AdminAPI.issueDonationCertificate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-donations'] });
      Alert.alert("Certificate Issued", "A verifiable digital certificate was issued to the donor.");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.message || "Failed to issue certificate.");
    }
  });

  const handleVerify = (id: string, status: 'VERIFIED' | 'REJECTED') => {
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to mark this donation as ${status}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          style: status === 'REJECTED' ? 'destructive' : 'default',
          onPress: () => verifyMutation.mutate({ id, status }) 
        }
      ]
    );
  };

  const records = data?.items || data?.data || data?.results || (Array.isArray(data) ? data : []);

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
          refreshing={isLoading}
          onRefresh={refetch}
          renderItem={({ item }) => {
            const donor = item.donorProfileId?.userId || item.donorProfileId || {};
            const donorName = donor.name || 'Anonymous Donor';
            const bloodGroup = item.donorProfileId?.bloodGroup || donor.bloodGroup || 'Blood Donor';

            return (
              <View style={styles.card}>
                <View style={styles.cardInfo}>
                  <View style={styles.headerRow}>
                    <Text style={styles.donorName}>{donorName}</Text>
                    <View style={[styles.badge, item.verificationStatus === 'VERIFIED' ? styles.badgeVerified : styles.badgePending]}>
                      <Text style={[styles.badgeText, item.verificationStatus === 'VERIFIED' ? styles.badgeTextVerified : styles.badgeTextPending]}>
                        {item.verificationStatus}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.hospitalName}>🏥 {item.hospitalName || 'Healthcare Facility'}</Text>
                  <Text style={styles.details}>🩸 Blood Group: {bloodGroup}</Text>
                  <Text style={styles.details}>📅 Date: {item.donationDate ? new Date(item.donationDate).toLocaleDateString() : 'N/A'}</Text>
                  {item.verifiedBy && <Text style={styles.details}>✓ Verified by Admin</Text>}
                </View>

                <View style={styles.actionRow}>
                  {item.verificationStatus === 'PENDING' && (
                    <>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.verifyButton]}
                        onPress={() => handleVerify(item._id, 'VERIFIED')}
                      >
                        <Text style={styles.verifyText}>Verify</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleVerify(item._id, 'REJECTED')}
                      >
                        <Text style={styles.rejectText}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {item.verificationStatus === 'VERIFIED' && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.certButton]}
                      onPress={() => certMutation.mutate(item._id)}
                      disabled={certMutation.isPending}
                    >
                      <Text style={styles.certText}>Issue Cert</Text>
                    </TouchableOpacity>
                  )}
                </View>
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
  cardInfo: {
    marginBottom: spacing.s,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  donorName: {
    ...typography.h3,
    color: colors.text,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeVerified: {
    backgroundColor: '#ECFDF5',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  badgeTextVerified: {
    color: '#065F46',
  },
  badgeTextPending: {
    color: '#92400E',
  },
  hospitalName: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.primaryDark,
    marginVertical: 2,
  },
  details: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.s,
    marginTop: spacing.s,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.s,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.s,
    borderRadius: 8,
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
  certButton: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
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
  },
  certText: {
    ...typography.caption,
    fontWeight: 'bold',
    color: '#1D4ED8',
  }
});
