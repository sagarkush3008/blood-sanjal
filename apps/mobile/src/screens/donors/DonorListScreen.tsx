import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Pressable,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DonorsAPI, DonorSearchParams } from '../../api/donors.api';
import { ContactRequestsAPI } from '../../api/contactRequests.api';
import { DonorCard } from '../../components/donors/DonorCard';
import { SkeletonCard, PrimaryButton } from '../../components/common';
import { SearchFeeModal } from '../../components/payments/SearchFeeModal';
import { colors, fonts } from '../../theme';

const BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];

export const DonorListScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();

  // Read route parameter passed from BloodGroupsRegisteredGrid or navigation (e.g. { selectedGroup: 'B+' })
  const initialGroup = route.params?.selectedGroup || route.params?.bloodGroup || 'B+';
  const [selectedGroup, setSelectedGroup] = useState<string>(initialGroup);

  // Contact request modal state
  const [selectedDonor, setSelectedDonor] = useState<any | null>(null);
  const [contactMessage, setContactMessage] = useState<string>('');
  const [requestedDonorIds, setRequestedDonorIds] = useState<Set<string>>(new Set());

  const [feeModalVisible, setFeeModalVisible] = useState<boolean>(false);

  // Fetch donors for the selected blood group
  const {
    data: donorsData,
    isLoading,
    isRefetching,
    error: donorsError,
    refetch,
  } = useQuery({
    queryKey: ['donors', 'list', selectedGroup],
    queryFn: async () => {
      const params: DonorSearchParams = { bloodGroup: selectedGroup };
      const res = await DonorsAPI.search(params);
      const raw = res.data?.data || res.data;
      return Array.isArray(raw) ? raw : raw?.donors || [];
    },
    staleTime: 60 * 1000,
  });

  const donorsList = useMemo(() => {
    return Array.isArray(donorsData) ? donorsData : [];
  }, [donorsData]);

  // Contact Request Mutation
  const requestMutation = useMutation({
    mutationFn: (payload: { donorId: string; message?: string }) =>
      ContactRequestsAPI.create(payload),
    onSuccess: () => {
      if (selectedDonor) {
        setRequestedDonorIds((prev) =>
          new Set(prev).add(selectedDonor.id || selectedDonor.userId || selectedDonor._id)
        );
      }
      setSelectedDonor(null);
      setContactMessage('');
      queryClient.invalidateQueries({ queryKey: ['contact-requests'] });
      Alert.alert(
        'Request Sent! ✉️',
        'The donor has been notified. When they accept, verified contact details will be revealed in accordance with privacy policies.'
      );
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Unable to send contact request. You may already have a pending request.';
      Alert.alert('Request Failed', msg);
    },
  });

  const handleOpenContactModal = (donor: any) => {
    setSelectedDonor(donor);
    setContactMessage(
      `Hello ${donor.name || 'Donor'}, I am in urgent need of ${donor.bloodGroup || selectedGroup} blood. Please accept this request to connect.`
    );
  };

  const handleSendContactRequest = () => {
    if (!selectedDonor) return;
    const donorId = selectedDonor.userId || selectedDonor.id || selectedDonor._id;
    requestMutation.mutate({
      donorId,
      message: contactMessage.trim(),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* 1. Sleek Sticky App Bar */}
      <View style={styles.appBar}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>

        <View style={styles.titleContainer}>
          <Text style={styles.appBarTitle} numberOfLines={1}>
            Available Donors ({selectedGroup})
          </Text>
          <Text style={styles.appBarSubtitle}>
            {donorsList.length} verified voluntary {donorsList.length === 1 ? 'donor' : 'donors'}
          </Text>
        </View>

        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>{selectedGroup}</Text>
        </View>
      </View>

      {/* Quick Blood Group Filter Pills */}
      <View style={styles.filterBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {BLOOD_GROUPS.map((bg) => {
            const isSelected = bg === selectedGroup;
            return (
              <Pressable
                key={bg}
                onPress={() => setSelectedGroup(bg)}
                style={({ pressed }) => [
                  styles.filterPill,
                  isSelected && styles.filterPillActive,
                  pressed && styles.filterPillPressed,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                  ]}
                >
                  {bg}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. FlatList with Off-White Screen Background (#F9FAFB), 20px Padding & 16px Gaps */}
      {isLoading ? (
        <View style={styles.skeletonContainer}>
          <SkeletonCard height={124} borderRadius={16} style={styles.skeletonItem} />
          <SkeletonCard height={124} borderRadius={16} style={styles.skeletonItem} />
          <SkeletonCard height={124} borderRadius={16} style={styles.skeletonItem} />
        </View>
      ) : (
        <FlatList
          data={donorsList}
          keyExtractor={(item, index) => item._id || item.id || `donor-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => {
            const donorId = item.userId || item.id || item._id;
            const isRequested = requestedDonorIds.has(donorId);

            return (
              <DonorCard
                name={item.name || 'Anonymous Donor'}
                bloodGroup={item.bloodGroup || selectedGroup}
                location={item.location || item.city || item.district || 'Nepal'}
                distance={item.distance}
                donorStatus={item.donorStatus || (item.active ? 'ACTIVE' : 'INACTIVE')}
                totalDonations={item.totalDonations || 0}
                lastDonationDate={item.lastDonationAt || item.lastDonationDate}
                reminderDate={item.reminderDate}
                isRequested={isRequested}
                onRequestContact={() => handleOpenContactModal(item)}
              />
            );
          }}
          ListEmptyComponent={
            /* 4. Beautiful Centralized Empty State */
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <View style={styles.emptyIconRow}>
                  <Ionicons name="search-outline" size={24} color="#94A3B8" />
                  <Ionicons name="water" size={16} color="#DC2626" style={styles.emptyDropIcon} />
                </View>
              </View>

              <Text style={styles.emptyTitle}>No donors found</Text>
              <Text style={styles.emptySubtext}>
                We couldn't find any verified voluntary donors for blood group {selectedGroup} in this area. Try selecting an adjacent blood group or create an urgent request.
              </Text>

              <View style={styles.emptyActionWrapper}>
                <PrimaryButton
                  title="Post Urgent Blood Request"
                  onPress={() => navigation.navigate('CreateRequest', { bloodGroup: selectedGroup })}
                  style={styles.emptyActionBtn}
                />
              </View>
            </View>
          }
        />
      )}

      {/* Contact Request Modal Dialog */}
      <Modal
        visible={!!selectedDonor}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDonor(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Contact Voluntary Donor</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedDonor?.name || 'Donor'} ({selectedDonor?.bloodGroup || selectedGroup})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedDonor(null)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalPrompt}>
                Send a message with patient urgency and hospital location:
              </Text>
              <TextInput
                style={styles.messageInput}
                multiline
                numberOfLines={3}
                placeholder="Explain patient condition, hospital name, and units required..."
                placeholderTextColor="#94A3B8"
                value={contactMessage}
                onChangeText={setContactMessage}
              />
              <Text style={styles.privacyNote}>
                🔒 Privacy Protected: Direct phone numbers and contact channels are revealed immediately once the donor accepts your request.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelectedDonor(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  requestMutation.isPending && styles.sendBtnDisabled,
                ]}
                onPress={handleSendContactRequest}
                disabled={requestMutation.isPending}
              >
                <Text style={styles.sendBtnText}>
                  {requestMutation.isPending ? 'Sending...' : 'Send Request'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Search & Platform Maintenance Fee Modal */}
      <SearchFeeModal
        visible={feeModalVisible}
        onClose={() => setFeeModalVisible(false)}
        onSuccess={() => {
          setFeeModalVisible(false);
          refetch();
        }}
        selectedBloodGroup={selectedGroup}
        amount="NPR 15.00"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Pure off-white so white donor cards pop out naturally
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backButtonPressed: {
    backgroundColor: '#E2E8F0',
    transform: [{ scale: 0.96 }],
  },
  titleContainer: {
    flex: 1,
  },
  appBarTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: '#111827',
    letterSpacing: -0.3,
  },
  appBarSubtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#6B7280',
    marginTop: 1,
  },
  badgePill: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  badgePillText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#DC2626',
  },
  filterBarWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  filterPillPressed: {
    opacity: 0.82,
  },
  filterPillText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#374151',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
  },
  listContent: {
    paddingHorizontal: 20, // Generous 20px horizontal padding
    paddingTop: 16,
    paddingBottom: 40,
  },
  itemSeparator: {
    height: 16, // 16px vertical gap between each donor card
  },
  skeletonContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  skeletonItem: {
    backgroundColor: '#FFFFFF',
  },
  // 4. Beautiful Centralized Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6', // Minimal gray circular background
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emptyDropIcon: {
    position: 'absolute',
    bottom: -4,
    right: -6,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#111827', // Dark gray
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#6B7280', // Soft gray
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 290,
    marginBottom: 24,
  },
  emptyActionWrapper: {
    width: '100%',
    paddingHorizontal: 20,
  },
  emptyActionBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 14,
  },
  // Contact Request Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 18,
  },
  modalPrompt: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#334155',
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: '#0F172A',
    minHeight: 74,
    textAlignVertical: 'top',
  },
  privacyNote: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: '#64748B',
    marginTop: 10,
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#475569',
  },
  sendBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#DC2626',
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendBtnText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
});
