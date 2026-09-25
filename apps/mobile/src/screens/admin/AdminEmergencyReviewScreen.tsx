import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminAPI } from '../../api/admin.api';
import { colors, spacing, typography } from '../../theme';

export const AdminEmergencyReviewScreen = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-emergency-requests'],
    queryFn: () => AdminAPI.getRequests({ urgency: 'EMERGENCY', status: 'PENDING_VERIFICATION' }).then(res => res.data.data || res.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'APPROVE' | 'REJECT' }) => 
      AdminAPI.reviewEmergencyRequest(id, { action }),
    onSuccess: (res, variables) => {
      Alert.alert(
        variables.action === 'APPROVE' ? "Approved & Broadcasted" : "Rejected",
        variables.action === 'APPROVE' 
          ? "The emergency has been verified and all compatible donors in the vicinity are being notified." 
          : "The request was rejected."
      );
      queryClient.invalidateQueries({ queryKey: ['admin-emergency-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.message || "Failed to process review.");
    }
  });

  const handleReview = (id: string, action: 'APPROVE' | 'REJECT') => {
    Alert.alert(
      `Confirm ${action === 'APPROVE' ? 'Approval' : 'Rejection'}`,
      `Are you sure you want to ${action.toLowerCase()} this emergency request?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: action, 
          style: action === 'REJECT' ? 'destructive' : 'default',
          onPress: () => reviewMutation.mutate({ id, action }) 
        }
      ]
    );
  };

  const requests = Array.isArray(data) ? data : data?.items || [];

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.danger} style={{ marginTop: spacing.xl }} />
      ) : requests.length === 0 ? (
        <Text style={styles.emptyState}>No pending emergency broadcasts to review.</Text>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshing={isLoading}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.bloodGroup}>{item.bloodGroup}</Text>
                <Text style={styles.urgencyBadge}>EMERGENCY</Text>
              </View>
              
              <Text style={styles.detailText}><Text style={styles.label}>Patient:</Text> {item.patientName}</Text>
              <Text style={styles.detailText}><Text style={styles.label}>Hospital:</Text> {item.hospitalName}</Text>
              <Text style={styles.detailText}><Text style={styles.label}>Reason:</Text> {item.reason}</Text>
              <Text style={styles.detailText}><Text style={styles.label}>Contact:</Text> {item.contactPhone}</Text>

              <View style={styles.actions}>
                <TouchableOpacity 
                  style={[styles.button, styles.approveButton]} 
                  onPress={() => handleReview(item._id, 'APPROVE')}
                >
                  <Text style={styles.buttonText}>Approve & Broadcast</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.rejectButton]} 
                  onPress={() => handleReview(item._id, 'REJECT')}
                >
                  <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>
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
    borderColor: colors.danger,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  bloodGroup: {
    ...typography.h2,
    color: colors.danger,
  },
  urgencyBadge: {
    ...typography.caption,
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: 'bold',
  },
  detailText: {
    ...typography.body2,
    color: colors.text,
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.m,
    gap: spacing.s,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.s,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    color: colors.surface,
    ...typography.button,
    fontSize: 14,
  }
});
