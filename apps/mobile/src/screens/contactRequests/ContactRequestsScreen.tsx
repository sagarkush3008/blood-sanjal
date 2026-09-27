import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ContactRequestsAPI } from '../../api/contactRequests.api';
import { useAuthStore } from '../../store/authStore';
import { ContactRequestCard } from '../../components/donors/ContactRequestCard';
import { ConfirmDialog, EmptyState, SkeletonCard } from '../../components/common';
import { colors, spacing } from '../../theme';

export const ContactRequestsScreen = () => {
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'RECEIVED' | 'SENT'>('RECEIVED');
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    action: () => void;
    isDestructive?: boolean;
    confirmText?: string;
  }>({
    visible: false,
    title: '',
    message: '',
    action: () => {},
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['contact-requests'],
    queryFn: () => ContactRequestsAPI.list().then((res) => res.data?.data || res.data),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => ContactRequestsAPI.accept(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-requests'] });
      Alert.alert(
        'Request Accepted! 🎉',
        'Your contact channel has been securely revealed to the requester.'
      );
    },
    onError: (err: any) => {
      Alert.alert(
        'Action Failed',
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Failed to accept request.'
      );
    },
  });

  const declineMutation = useMutation({
    mutationFn: (id: string) => ContactRequestsAPI.decline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-requests'] });
    },
    onError: (err: any) => {
      Alert.alert(
        'Action Failed',
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Failed to decline request.'
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => ContactRequestsAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-requests'] });
    },
    onError: (err: any) => {
      Alert.alert(
        'Action Failed',
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Failed to cancel request.'
      );
    },
  });

  const handleAcceptPrompt = (id: string, name: string) => {
    setConfirmDialog({
      visible: true,
      title: 'Consent to Reveal Contact?',
      message: `Accepting will permit ${name} to view your registered contact details (phone/email) for blood donation coordination.`,
      confirmText: 'Accept & Reveal',
      isDestructive: false,
      action: () => acceptMutation.mutate(id),
    });
  };

  const handleDeclinePrompt = (id: string, name: string) => {
    setConfirmDialog({
      visible: true,
      title: 'Decline Contact Request?',
      message: `Are you sure you want to decline this request from ${name}? Your contact details will remain completely hidden.`,
      confirmText: 'Decline',
      isDestructive: true,
      action: () => declineMutation.mutate(id),
    });
  };

  const handleCancelPrompt = (id: string) => {
    setConfirmDialog({
      visible: true,
      title: 'Cancel Outgoing Request?',
      message: 'Are you sure you want to cancel this pending contact request?',
      confirmText: 'Cancel Request',
      isDestructive: true,
      action: () => cancelMutation.mutate(id),
    });
  };

  const allRequests: any[] = Array.isArray(data)
    ? data
    : data?.items || data?.data || data?.results || [];

  const currentUserId = user?.id || user?._id;

  // Filter into received vs sent based on current user
  const receivedRequests = allRequests.filter((item) => {
    const donorId =
      typeof item.donorId === 'object' ? item.donorId?._id : item.donorId;
    return donorId === currentUserId;
  });

  const sentRequests = allRequests.filter((item) => {
    const requesterId =
      typeof item.requesterId === 'object' ? item.requesterId?._id : item.requesterId;
    return requesterId === currentUserId;
  });

  const currentList = activeTab === 'RECEIVED' ? receivedRequests : sentRequests;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Contact Requests</Text>
          <Text style={styles.headerSubtitle}>
            Privacy-safe donor & recipient consent center
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'RECEIVED' && styles.tabButtonActive]}
          onPress={() => setActiveTab('RECEIVED')}
        >
          <Ionicons
            name="arrow-down-circle-outline"
            size={16}
            color={activeTab === 'RECEIVED' ? colors.primary : '#64748B'}
          />
          <Text
            style={[styles.tabText, activeTab === 'RECEIVED' && styles.tabTextActive]}
          >
            Received ({receivedRequests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'SENT' && styles.tabButtonActive]}
          onPress={() => setActiveTab('SENT')}
        >
          <Ionicons
            name="arrow-up-circle-outline"
            size={16}
            color={activeTab === 'SENT' ? colors.primary : '#64748B'}
          />
          <Text
            style={[styles.tabText, activeTab === 'SENT' && styles.tabTextActive]}
          >
            Sent ({sentRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List Container */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={{ padding: 16 }}>
            <SkeletonCard height={130} borderRadius={16} />
            <SkeletonCard height={130} borderRadius={16} />
          </View>
        ) : currentList.length === 0 ? (
          <EmptyState
            icon="mail-unread-outline"
            title={
              activeTab === 'RECEIVED'
                ? 'No Incoming Contact Requests'
                : 'No Outgoing Contact Requests'
            }
            description={
              activeTab === 'RECEIVED'
                ? 'When recipients request your contact for blood coordination, requests will appear here for your review and consent.'
                : 'You have not submitted any donor contact requests yet. Search for donors to connect.'
            }
            actionTitle={activeTab === 'SENT' ? 'Find Donors' : undefined}
            onAction={
              activeTab === 'SENT'
                ? () => navigation.navigate('FindBlood')
                : undefined
            }
          />
        ) : (
          <FlatList
            data={currentList}
            keyExtractor={(item) => item._id || item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={refetch}
            renderItem={({ item }) => {
              const requester =
                typeof item.requesterId === 'object' ? item.requesterId : null;
              const donor =
                typeof item.donorId === 'object' ? item.donorId : null;

              const otherPartyName =
                activeTab === 'RECEIVED'
                  ? requester?.name || 'Recipient'
                  : donor?.name || 'Donor';

              const bloodGroup =
                activeTab === 'RECEIVED'
                  ? requester?.bloodGroup
                  : donor?.bloodGroup;

              const contactInfo =
                item.revealedContactInfo ||
                (item.status === 'ACCEPTED'
                  ? { phone: donor?.phone, email: donor?.email }
                  : undefined);

              return (
                <ContactRequestCard
                  type={activeTab}
                  otherPartyName={otherPartyName}
                  bloodGroup={bloodGroup}
                  status={item.status}
                  message={item.message}
                  createdAt={item.createdAt}
                  contactInfo={contactInfo}
                  onAccept={() => handleAcceptPrompt(item._id, otherPartyName)}
                  onDecline={() => handleDeclinePrompt(item._id, otherPartyName)}
                  onCancel={() => handleCancelPrompt(item._id)}
                />
              );
            }}
          />
        )}
      </View>

      {/* Confirmation Modal */}
      <ConfirmDialog
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        isDestructive={confirmDialog.isDestructive}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, visible: false }))}
        onConfirm={() => {
          confirmDialog.action();
          setConfirmDialog((prev) => ({ ...prev, visible: false }));
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabButtonActive: {
    backgroundColor: colors.primarySoft,
    borderColor: '#FECACA',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
});
