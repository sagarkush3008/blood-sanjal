import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DonorsAPI, DonorSearchParams } from '../../api/donors.api';
import { ContactRequestsAPI } from '../../api/contactRequests.api';
import { PaymentsAPI } from '../../api/payments.api';
import { BloodGroupChip, EmptyState, SkeletonCard, PrimaryButton } from '../../components/common';
import { DonorCard } from '../../components/donors/DonorCard';
import { colors, spacing } from '../../theme';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const DISTANCES = [5, 10, 25, 50];

export const FindBloodScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();

  const initialGroup = route.params?.bloodGroup || route.params?.preselectedBloodGroup || 'O+';

  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>(initialGroup);
  const [selectedDistance, setSelectedDistance] = useState<number>(10);
  const [searchTriggered, setSearchTriggered] = useState<boolean>(true);

  // Contact Request Dialog State
  const [selectedDonor, setSelectedDonor] = useState<any | null>(null);
  const [contactMessage, setContactMessage] = useState<string>('');
  const [requestedDonorIds, setRequestedDonorIds] = useState<Set<string>>(new Set());

  // Search Query
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['donors', 'search', selectedBloodGroup, selectedDistance],
    queryFn: async () => {
      const params: DonorSearchParams = {
        bloodGroup: selectedBloodGroup,
        distance: selectedDistance * 1000,
      };
      const res = await DonorsAPI.search(params);
      return res.data?.data || res.data;
    },
    enabled: searchTriggered,
    retry: 1,
  });

  // Activate Search Fee Mutation
  const activateFeeMutation = useMutation({
    mutationFn: () => PaymentsAPI.confirmMockSearchFee(),
    onSuccess: () => {
      Alert.alert(
        'Access Activated! 🎉',
        'Your 24-hour donor search access is now active. Refetching donors...'
      );
      refetch();
    },
    onError: (err: any) => {
      Alert.alert(
        'Activation Error',
        err.response?.data?.error?.message || 'Failed to activate search access.'
      );
    },
  });

  // Send Contact Request Mutation
  const requestMutation = useMutation({
    mutationFn: (payload: { donorId: string; message?: string }) =>
      ContactRequestsAPI.create(payload),
    onSuccess: () => {
      if (selectedDonor) {
        setRequestedDonorIds((prev) => new Set(prev).add(selectedDonor.id || selectedDonor.userId));
      }
      setSelectedDonor(null);
      setContactMessage('');
      queryClient.invalidateQueries({ queryKey: ['contact-requests'] });
      Alert.alert(
        'Contact Request Sent! ✉️',
        'The donor has been notified. Once they accept your request, verified contact channels will become accessible.'
      );
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Unable to send contact request. You may already have an active request with this donor.';
      Alert.alert('Request Failed', msg);
    },
  });

  const handleSearch = () => {
    setSearchTriggered(true);
    refetch();
  };

  const handleOpenContactModal = (donor: any) => {
    setSelectedDonor(donor);
    setContactMessage(
      `Hello ${donor.name}, I am in urgent need of ${donor.bloodGroup} blood. Please accept this request so we can connect.`
    );
  };

  const handleSendContact = () => {
    if (!selectedDonor) return;
    const donorId = selectedDonor.userId || selectedDonor.id;
    requestMutation.mutate({
      donorId,
      message: contactMessage.trim(),
    });
  };

  // Determine if payment is required (HTTP 402)
  const isPaymentRequired =
    (error as any)?.response?.status === 402 ||
    (error as any)?.response?.data?.error?.code === 'PAYMENT_REQUIRED';

  const rawResults = data?.results || (Array.isArray(data) ? data : []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="search" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Find Blood Donors</Text>
            <Text style={styles.headerSubtitle}>
              Locate verified, consent-gated donors across Nepal
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Select Needed Blood Group</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {BLOOD_GROUPS.map((bg) => (
            <BloodGroupChip
              key={bg}
              bloodGroup={bg}
              selected={selectedBloodGroup === bg}
              onPress={(group) => setSelectedBloodGroup(group)}
              style={styles.chip}
            />
          ))}
        </ScrollView>

        <View style={styles.distanceRow}>
          <Text style={styles.distanceLabel}>Distance Radius:</Text>
          <View style={styles.distancePills}>
            {DISTANCES.map((dist) => (
              <TouchableOpacity
                key={dist}
                style={[
                  styles.distancePill,
                  selectedDistance === dist && styles.distancePillActive,
                ]}
                onPress={() => setSelectedDistance(dist)}
              >
                <Text
                  style={[
                    styles.distancePillText,
                    selectedDistance === dist && styles.distancePillTextActive,
                  ]}
                >
                  {dist} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <PrimaryButton
          title="Search Donors"
          icon="search-outline"
          onPress={handleSearch}
          loading={isLoading}
          style={{ marginTop: 4 }}
        />
      </View>

      {/* Payment / Search Fee Banner if 402 */}
      {isPaymentRequired && (
        <View style={styles.feeBanner}>
          <View style={styles.feeHeader}>
            <Ionicons name="card-outline" size={22} color="#B45309" />
            <Text style={styles.feeTitle}>Platform Search Fee (NPR 50)</Text>
          </View>
          <Text style={styles.feeText}>
            A small 24-hour maintenance contribution is required to search verified donors.
            Blood is never charged for.
          </Text>
          <TouchableOpacity
            style={styles.feePayButton}
            onPress={() => activateFeeMutation.mutate()}
            disabled={activateFeeMutation.isPending}
          >
            <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.feePayButtonText}>
              {activateFeeMutation.isPending ? 'Activating Access...' : 'Activate 24h Access (Mock NPR 50)'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Donors Results List */}
      <View style={styles.resultsContainer}>
        {isLoading ? (
          <View style={{ padding: 16 }}>
            <SkeletonCard height={140} borderRadius={16} />
            <SkeletonCard height={140} borderRadius={16} />
            <SkeletonCard height={140} borderRadius={16} />
          </View>
        ) : isError && !isPaymentRequired ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Search Could Not Complete"
            description="Unable to reach the donor registry. Please verify your connection."
            actionTitle="Try Again"
            onAction={handleSearch}
          />
        ) : rawResults.length === 0 && !isPaymentRequired ? (
          <EmptyState
            icon="water-outline"
            title={`No ${selectedBloodGroup} Donors Found Nearby`}
            description="No active donors match this criteria within the selected radius. Try expanding your search distance or submit an urgent blood request."
            actionTitle="Create Blood Request"
            onAction={() => navigation.navigate('CreateRequest', { bloodGroup: selectedBloodGroup })}
          />
        ) : (
          <FlatList
            data={rawResults}
            keyExtractor={(item) => item.id || item.userId || item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const donorId = item.id || item.userId;
              const isRequested = requestedDonorIds.has(donorId);
              return (
                <DonorCard
                  name={item.name}
                  bloodGroup={item.bloodGroup}
                  donorStatus={item.donorStatus}
                  totalDonations={item.totalDonations}
                  lastDonationDate={item.lastDonationDate}
                  location={
                    item.approximateLocation?.districtId ||
                    item.approximateLocation?.cityId ||
                    'Broad Region'
                  }
                  isRequested={isRequested}
                  onRequestContact={() => handleOpenContactModal(item)}
                />
              );
            }}
          />
        )}
      </View>

      {/* Contact Request Modal Dialog */}
      <Modal
        visible={!!selectedDonor}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDonor(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Request Contact Consent</Text>
                <Text style={styles.modalSubtitle}>
                  Recipient to Donor: {selectedDonor?.name} ({selectedDonor?.bloodGroup})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedDonor(null)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Emergency / Request Message</Text>
            <TextInput
              style={styles.messageInput}
              multiline
              numberOfLines={4}
              value={contactMessage}
              onChangeText={setContactMessage}
              placeholder="Explain hospital location, patient condition, and units needed..."
              textAlignVertical="top"
            />

            <View style={styles.consentNotice}>
              <Ionicons name="lock-closed" size={14} color="#10B981" />
              <Text style={styles.consentNoticeText}>
                The donor must review and approve this request before their phone number or direct contact info is unlocked.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setSelectedDonor(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleSendContact}
                disabled={requestMutation.isPending}
              >
                <Text style={styles.modalSubmitText}>
                  {requestMutation.isPending ? 'Sending...' : 'Send Request'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
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
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chipsRow: {
    paddingBottom: 10,
  },
  chip: {
    marginRight: 8,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  distanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  distancePills: {
    flexDirection: 'row',
    gap: 6,
  },
  distancePill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  distancePillActive: {
    backgroundColor: colors.primarySoft,
    borderColor: '#FECACA',
  },
  distancePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  distancePillTextActive: {
    color: colors.primary,
  },
  feeBanner: {
    margin: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  feeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  feeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
  },
  feeText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
    marginBottom: 12,
  },
  feePayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  feePayButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  resultsContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 90,
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
  },
  consentNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  consentNoticeText: {
    fontSize: 12,
    color: '#065F46',
    flex: 1,
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  modalSubmitButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
