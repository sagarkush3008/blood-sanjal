import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ContactRequestsAPI } from '../../api/donors.api';
import { ContactRequestCard } from '../../components/donors/ContactRequestCard';
import { colors, spacing, typography } from '../../theme';

export const ContactRequestsScreen = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'RECEIVED' | 'SENT'>('RECEIVED');

  // Fetch Requests
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['contact-requests', tab],
    queryFn: () => ContactRequestsAPI.list({ type: tab }).then(res => res.data.data || res.data),
  });

  // Accept Mutation
  const acceptMutation = useMutation({
    mutationFn: (id: string) => ContactRequestsAPI.accept(id),
    onSuccess: () => {
      Alert.alert("Success", "Contact request accepted. Your details are now visible to the requester.");
      queryClient.invalidateQueries({ queryKey: ['contact-requests'] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.message || "Failed to accept request.");
    }
  });

  // Decline Mutation
  const declineMutation = useMutation({
    mutationFn: (id: string) => ContactRequestsAPI.decline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-requests'] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.message || "Failed to decline request.");
    }
  });

  const handleAccept = (id: string) => {
    Alert.alert(
      "Confirm Accept",
      "Are you sure you want to share your contact details with this user?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Accept", onPress: () => acceptMutation.mutate(id) }
      ]
    );
  };

  const handleDecline = (id: string) => {
    Alert.alert(
      "Confirm Decline",
      "Are you sure you want to decline this request?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Decline", style: 'destructive', onPress: () => declineMutation.mutate(id) }
      ]
    );
  };

  const requests = Array.isArray(data) ? data : data?.items || [];

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, tab === 'RECEIVED' && styles.activeTab]}
          onPress={() => setTab('RECEIVED')}
        >
          <Text style={[styles.tabText, tab === 'RECEIVED' && styles.activeTabText]}>Received</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, tab === 'SENT' && styles.activeTab]}
          onPress={() => setTab('SENT')}
        >
          <Text style={[styles.tabText, tab === 'SENT' && styles.activeTabText]}>Sent</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : requests.length === 0 ? (
        <Text style={styles.emptyState}>No contact requests found in this category.</Text>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshing={isLoading}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <ContactRequestCard
              type={tab}
              otherPartyName={tab === 'RECEIVED' ? item.requesterName : item.donorName}
              status={item.status}
              contactInfo={item.status === 'ACCEPTED' ? { phone: item.donorPhone, email: item.donorEmail } : undefined}
              onAccept={() => handleAccept(item._id)}
              onDecline={() => handleDecline(item._id)}
            />
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
    padding: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.s,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.primaryLight,
  },
  tabText: {
    ...typography.button,
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.primaryDark,
  },
  listContainer: {
    padding: spacing.l,
  },
  emptyState: {
    ...typography.body1,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.l,
  }
});
