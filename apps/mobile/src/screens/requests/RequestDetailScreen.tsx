import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BloodRequestsAPI } from '../../api/requests.api';
import { useAuthStore } from '../../store/authStore';
import { StatusBadge, ConfirmDialog, SkeletonCard, PrimaryButton } from '../../components/common';
import { Timeline, TimelineEvent } from '../../components/requests/Timeline';
import { colors, spacing } from '../../theme';

export const RequestDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const requestId = route.params?.id;

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

  const { data: request, isLoading, refetch } = useQuery({
    queryKey: ['blood-request', requestId],
    queryFn: () => BloodRequestsAPI.getById(requestId).then((res) => res.data?.data || res.data),
    enabled: !!requestId,
  });

  // Cancel Request Mutation
  const cancelMutation = useMutation({
    mutationFn: () => BloodRequestsAPI.cancel(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blood-requests'] });
      queryClient.invalidateQueries({ queryKey: ['blood-request', requestId] });
      Alert.alert('Request Cancelled', 'The blood request has been marked as cancelled.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to cancel request.');
    },
  });

  // Fulfill Request Mutation
  const fulfillMutation = useMutation({
    mutationFn: () => {
      const remaining = Math.max(1, (request?.unitsRequired || 1) - (request?.unitsFulfilled || 0));
      return BloodRequestsAPI.fulfill(requestId, remaining);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blood-requests'] });
      queryClient.invalidateQueries({ queryKey: ['blood-request', requestId] });
      Alert.alert('Request Fulfilled! 🎉', 'The blood request has been marked as fulfilled.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to mark as fulfilled.');
    },
  });

  const handleShare = async () => {
    if (!request) return;
    try {
      await Share.share({
        message: `🚨 Blood Needed on Blood Sanjal!\nBlood Group: ${request.bloodGroup} (${request.unitsRequired || 1} Units)\nHospital: ${request.hospitalName || request.hospital}\nUrgency: ${request.urgency}\nHelp save a life by opening Blood Sanjal.`,
      });
    } catch {}
  };

  const handleCancelPrompt = () => {
    setConfirmDialog({
      visible: true,
      title: 'Cancel Blood Request?',
      message: 'Are you sure you want to cancel this request? Matching donors will no longer be notified.',
      confirmText: 'Cancel Request',
      isDestructive: true,
      action: () => cancelMutation.mutate(),
    });
  };

  const handleFulfillPrompt = () => {
    setConfirmDialog({
      visible: true,
      title: 'Mark as Fulfilled?',
      message: 'Have the required blood units been successfully received from donors or blood bank?',
      confirmText: 'Mark Fulfilled',
      isDestructive: false,
      action: () => fulfillMutation.mutate(),
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ padding: 20 }}>
          <SkeletonCard height={140} borderRadius={16} />
          <SkeletonCard height={200} borderRadius={16} />
          <SkeletonCard height={120} borderRadius={16} />
        </View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Blood request not found.</Text>
          <PrimaryButton title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const isRequester =
    request.requesterId === user?.id ||
    request.requesterId?._id === user?.id ||
    user?.role === 'ADMIN';

  const isClosed = request.status === 'FULFILLED' || request.status === 'CANCELLED';

  // Construct Timeline events based on real backend state
  const timelineEvents: TimelineEvent[] = [
    {
      title: 'Request Submitted',
      description: 'Request submitted to the Blood Sanjal registry.',
      timestamp: request.createdAt,
      status: 'COMPLETED',
    },
    {
      title: 'Platform Verification',
      description:
        request.status === 'PENDING_VERIFICATION'
          ? 'Administrator reviewing clinical details & evidence.'
          : 'Verified by Blood Sanjal administration.',
      timestamp: request.status !== 'PENDING_VERIFICATION' ? request.updatedAt : undefined,
      status:
        request.status === 'PENDING_VERIFICATION'
          ? 'CURRENT'
          : 'COMPLETED',
    },
    {
      title: 'Donor Matching & Broadcast',
      description:
        request.broadcastedAt
          ? 'Broadcast dispatched to matching compatible donors.'
          : request.status === 'ACTIVE'
          ? 'Active on registry. Matching nearby donors.'
          : 'Awaiting platform verification before broadcast.',
      timestamp: request.broadcastedAt,
      status:
        request.broadcastedAt || request.status === 'ACTIVE'
          ? 'COMPLETED'
          : request.status === 'PENDING_VERIFICATION'
          ? 'UPCOMING'
          : 'CURRENT',
    },
    {
      title: 'Fulfillment & Closure',
      description:
        request.status === 'FULFILLED'
          ? 'Required units successfully fulfilled.'
          : request.status === 'CANCELLED'
          ? 'Request cancelled by requester.'
          : 'Pending donor connections & fulfillment.',
      timestamp: isClosed ? request.updatedAt : undefined,
      status: isClosed ? 'COMPLETED' : 'UPCOMING',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blood Request Details</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Info Card */}
        <View style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.bloodBadge}>
              <Text style={styles.bloodBadgeText}>{request.bloodGroup}</Text>
            </View>
            <View style={styles.statusCol}>
              <View style={styles.badgeRow}>
                <StatusBadge status={request.urgency || 'NORMAL'} />
                <StatusBadge status={request.status} />
              </View>
              <Text style={styles.unitsText}>
                {request.unitsRequired || 1} Unit(s) Needed
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={16} color={colors.primary} />
            <Text style={styles.infoLabel}>Hospital:</Text>
            <Text style={styles.infoValue}>{request.hospitalName || request.hospital || 'Hospital'}</Text>
          </View>

          {request.hospitalLocation?.address ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#64748B" />
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>{request.hospitalLocation.address}</Text>
            </View>
          ) : null}

          {request.requiredDate ? (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
              <Text style={styles.infoLabel}>Required By:</Text>
              <Text style={styles.infoValue}>
                {new Date(request.requiredDate).toLocaleDateString()}
              </Text>
            </View>
          ) : null}

          {request.additionalInfo ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Clinical Notes / Context:</Text>
              <Text style={styles.notesText}>{request.additionalInfo}</Text>
            </View>
          ) : null}
        </View>

        {/* Timeline Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lifecycle Timeline</Text>
          <Timeline events={timelineEvents} />
        </View>

        {/* Requester Action Buttons */}
        {isRequester && !isClosed ? (
          <View style={styles.actionButtonsCol}>
            <PrimaryButton
              title="Mark as Fulfilled"
              icon="checkmark-circle-outline"
              onPress={handleFulfillPrompt}
              loading={fulfillMutation.isPending}
            />

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelPrompt}
              disabled={cancelMutation.isPending}
            >
              <Text style={styles.cancelButtonText}>Cancel This Request</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      {/* Confirmation Dialog */}
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
    justifyContent: 'space-between',
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
    fontSize: 17,
    fontFamily: 'Inter_800ExtraBold',
    color: '#0F172A',
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bloodBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  bloodBadgeText: {
    fontSize: 24,
    fontFamily: 'Inter_900Black',
    color: colors.primary,
  },
  statusCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  unitsText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#64748B',
  },
  infoValue: {
    fontSize: 13,
    color: '#0F172A',
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter_800ExtraBold',
    color: '#0F172A',
    marginBottom: 8,
  },
  actionButtonsCol: {
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 46,
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: colors.danger,
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
  },
});
