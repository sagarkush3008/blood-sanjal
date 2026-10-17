import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AdminAPI } from '../../api/admin.api';
import { apiClient } from '../../api/client';

export interface PendingRequestItem {
  _id: string;
  id?: string;
  patientName?: string;
  bloodGroup: string;
  unitsRequired: number;
  hospitalName: string;
  contactPhone?: string;
  urgency: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  status: string;
  createdAt: string;
  requesterId?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
    bloodGroup?: string;
  };
  contactPerson?: {
    name?: string;
    phone?: string;
  };
}

interface AdminPendingRequestsProps {
  onStatusUpdated?: (requestId: string, newStatus: 'approved' | 'rejected') => void;
}

export const AdminPendingRequests: React.FC<AdminPendingRequestsProps> = ({
  onStatusUpdated,
}) => {
  const [requests, setRequests] = useState<PendingRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // Fetch pending requests from Admin Backend Route: GET /api/admin/pending-requests
  const fetchPendingRequests = useCallback(async () => {
    try {
      let data: any;
      if (AdminAPI.getPendingRequests) {
        const res = await AdminAPI.getPendingRequests();
        data = res.data;
      } else {
        const res = await apiClient.get('/admin/pending-requests');
        data = res.data;
      }

      // Unwrap envelope if applicable
      const items: PendingRequestItem[] = Array.isArray(data)
        ? data
        : data?.data || data?.items || [];

      setRequests(items);
    } catch (error: any) {
      console.error('[AdminPendingRequests] Error fetching pending requests:', error);
      Alert.alert(
        'Fetch Error',
        error?.response?.data?.message || 'Unable to retrieve pending requests from server.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingRequests();
  };

  // Handle Approve or Reject with instant optimistic UI removal
  const handleUpdateStatus = async (
    targetItem: PendingRequestItem,
    status: 'approved' | 'rejected'
  ) => {
    const itemId = targetItem._id || targetItem.id;
    if (!itemId) return;

    // Snapshot current state for rollback on error
    const previousRequests = [...requests];

    // Optimistically remove from list immediately for fast, responsive UI
    setRequests((prev) => prev.filter((r) => (r._id || r.id) !== itemId));
    setActionInProgressId(itemId);

    try {
      // Call Admin Backend Route: PATCH /api/admin/request/:id/status
      if (AdminAPI.updateRequestApprovalStatus) {
        await AdminAPI.updateRequestApprovalStatus(itemId, status);
      } else {
        await apiClient.patch(`/admin/request/${itemId}/status`, { status });
      }

      if (onStatusUpdated) {
        onStatusUpdated(itemId, status);
      }
    } catch (error: any) {
      console.error(`[AdminPendingRequests] Failed to ${status} request:`, error);
      // Revert optimistic removal on failure
      setRequests(previousRequests);
      Alert.alert(
        'Action Failed',
        error?.response?.data?.message || `Failed to update request to ${status}. Reverted changes.`
      );
    } finally {
      setActionInProgressId(null);
    }
  };

  const confirmAction = (item: PendingRequestItem, status: 'approved' | 'rejected') => {
    const isApprove = status === 'approved';
    const actionLabel = isApprove ? 'Approve' : 'Reject';
    const patientText = item.patientName || item.requesterId?.name || 'this request';

    Alert.alert(
      `${actionLabel} Request`,
      `Are you sure you want to mark ${patientText}'s blood request as ${status}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabel,
          style: isApprove ? 'default' : 'destructive',
          onPress: () => handleUpdateStatus(item, status),
        },
      ]
    );
  };

  const renderCard = ({ item }: { item: PendingRequestItem }) => {
    const itemId = item._id || item.id || '';
    const isProcessing = actionInProgressId === itemId;
    const requesterName = item.requesterId?.name || item.contactPerson?.name || 'Requester';
    const patientName = item.patientName || 'Medical Emergency';
    const contactPhone = item.contactPhone || item.requesterId?.phone || item.contactPerson?.phone;
    const formattedDate = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Recent';

    const isUrgent = item.urgency === 'URGENT' || item.urgency === 'EMERGENCY';

    return (
      <View style={styles.card}>
        {/* Card Header: Blood Group, Urgency & Date */}
        <View style={styles.cardHeader}>
          <View style={styles.bloodBadge}>
            <Ionicons name="water" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.bloodBadgeText}>{item.bloodGroup}</Text>
          </View>

          <View style={styles.headerRight}>
            {isUrgent && (
              <View style={styles.urgentBadge}>
                <Ionicons name="flash" size={11} color="#DC2626" />
                <Text style={styles.urgentBadgeText}>{item.urgency}</Text>
              </View>
            )}
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>PENDING</Text>
            </View>
          </View>
        </View>

        {/* Patient & Requester Details */}
        <View style={styles.bodySection}>
          <Text style={styles.patientTitle}>{patientName}</Text>
          <Text style={styles.requesterSubtitle}>
            Requested by: <Text style={styles.boldText}>{requesterName}</Text>
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="business-outline" size={14} color="#64748B" />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.hospitalName || 'Local Medical Center'}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="beaker-outline" size={14} color="#64748B" />
            <Text style={styles.metaText}>
              Required Quantity: <Text style={styles.boldText}>{item.unitsRequired || 1} Unit(s)</Text>
            </Text>
          </View>

          {contactPhone ? (
            <View style={styles.metaRow}>
              <Ionicons name="call-outline" size={14} color="#64748B" />
              <Text style={styles.metaText}>{contactPhone}</Text>
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color="#94A3B8" />
            <Text style={styles.timestampText}>Submitted: {formattedDate}</Text>
          </View>
        </View>

        {/* Action Buttons: Green Approve and Red Reject */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton, isProcessing && styles.buttonDisabled]}
            onPress={() => confirmAction(item, 'rejected')}
            disabled={isProcessing}
            activeOpacity={0.7}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={17} color="#DC2626" style={styles.btnIcon} />
                <Text style={styles.rejectButtonText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton, isProcessing && styles.buttonDisabled]}
            onPress={() => confirmAction(item, 'approved')}
            disabled={isProcessing}
            activeOpacity={0.7}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={17} color="#FFFFFF" style={styles.btnIcon} />
                <Text style={styles.approveButtonText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#E63946" />
          <Text style={styles.loadingText}>Loading pending approvals...</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item, index) => item._id || item.id || `pending-${index}`}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#E63946"
              colors={['#E63946']}
            />
          }
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              <View>
                <Text style={styles.headerTitle}>Pending Approvals</Text>
                <Text style={styles.headerSubtitle}>
                  Review and verify incoming blood requests
                </Text>
              </View>
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>{requests.length}</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="checkmark-done" size={36} color="#16A34A" />
              </View>
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptySubtitle}>
                No pending requests awaiting approval right now.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

// Strictly Isolated Local Stylesheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter_500Medium',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  counterBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
  },
  counterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    fontFamily: 'Inter_700Bold',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    // Subtle shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bloodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E63946',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bloodBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  urgentBadgeText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadgeText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  bodySection: {
    marginBottom: 14,
  },
  patientTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
    fontFamily: 'Inter_700Bold',
  },
  requesterSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 10,
    fontFamily: 'Inter_400Regular',
  },
  boldText: {
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter_600SemiBold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 7,
  },
  metaText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
    fontFamily: 'Inter_400Regular',
  },
  timestampText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter_400Regular',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnIcon: {
    marginRight: 6,
  },
  rejectButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  approveButton: {
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    fontFamily: 'Inter_700Bold',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
});

export default AdminPendingRequests;
