import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CampaignsAPI } from '../../api/campaigns.api';
import { CampaignCard } from '../../components/campaigns/CampaignCard';
import { SkeletonCard, EmptyState, BloodGroupChip } from '../../components/common';
import { colors, spacing } from '../../theme';

const BLOOD_GROUPS = ['ALL', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const CampaignsScreen = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'ALL' | 'MY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');

  // Query all campaigns
  const {
    data: allData,
    isLoading: isLoadingAll,
    refetch: refetchAll,
    isRefetching: isRefetchingAll,
  } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => CampaignsAPI.list().then((res) => res.data?.data || res.data),
  });

  // Query user registered campaigns
  const {
    data: myData,
    isLoading: isLoadingMy,
    refetch: refetchMy,
    isRefetching: isRefetchingMy,
  } = useQuery({
    queryKey: ['my-campaigns'],
    queryFn: () => CampaignsAPI.listMy().then((res) => res.data?.data || res.data),
  });

  const allCampaigns: any[] = Array.isArray(allData)
    ? allData
    : allData?.items || allData?.results || (Array.isArray(allData?.data) ? allData.data : []);

  const myCampaigns: any[] = Array.isArray(myData)
    ? myData
    : myData?.items || myData?.results || (Array.isArray(myData?.data) ? myData.data : []);

  const myRegisteredIds = new Set(myCampaigns.map((c) => c._id || c.campaignId?._id));

  // RSVP Mutation
  const rsvpMutation = useMutation({
    mutationFn: async ({ id, isRegistered }: { id: string; isRegistered: boolean }) => {
      if (isRegistered) {
        return CampaignsAPI.withdraw(id);
      } else {
        return CampaignsAPI.participate(id);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
      Alert.alert(
        variables.isRegistered ? 'RSVP Cancelled' : 'RSVP Confirmed! 🩸',
        variables.isRegistered
          ? 'Your registration for this blood drive has been withdrawn.'
          : 'Thank you for registering to donate blood! We look forward to seeing you.'
      );
    },
    onError: (err: any) => {
      Alert.alert(
        'Action Failed',
        err.response?.data?.error?.message || err.response?.data?.message || 'Could not update RSVP status.'
      );
    },
  });

  const baseList = activeTab === 'ALL' ? allCampaigns : myCampaigns;

  const filteredCampaigns = baseList.filter((camp: any) => {
    const item = camp.campaignId || camp;
    const matchesSearch =
      !searchQuery ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.organizer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGroup =
      selectedGroup === 'ALL' ||
      (item.bloodGroupsNeeded && item.bloodGroupsNeeded.includes(selectedGroup));

    return matchesSearch && matchesGroup;
  });

  const isLoading = activeTab === 'ALL' ? isLoadingAll : isLoadingMy;
  const isRefetching = activeTab === 'ALL' ? isRefetchingAll : isRefetchingMy;
  const refetch = activeTab === 'ALL' ? refetchAll : refetchMy;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.badgePill}>
          <Ionicons name="calendar" size={13} color={colors.primary} />
          <Text style={styles.badgePillText}>BLOOD SANJAL COMMUNITY</Text>
        </View>
        <Text style={styles.title}>Blood Drives & Camps</Text>
        <Text style={styles.subtitle}>
          Discover voluntary community donation camps across hospitals, universities, and youth clubs.
        </Text>

        {/* Tab Toggle */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'ALL' && styles.tabBtnActive]}
            onPress={() => setActiveTab('ALL')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'ALL' && styles.tabBtnTextActive]}>
              All Drives ({allCampaigns.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'MY' && styles.tabBtnActive]}
            onPress={() => setActiveTab('MY')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'MY' && styles.tabBtnTextActive]}>
              My RSVP'd ({myCampaigns.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by city, venue, or organizer..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Blood Group Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipScroll}
        >
          {BLOOD_GROUPS.map((bg) => {
            const isSelected = selectedGroup === bg;
            return (
              <TouchableOpacity
                key={bg}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedGroup(bg)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {bg}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredCampaigns}
        keyExtractor={(item) => (item._id || item.campaignId?._id || Math.random().toString())}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        renderItem={({ item }) => {
          const camp = item.campaignId || item;
          const isRegistered = myRegisteredIds.has(camp._id);
          return (
            <CampaignCard
              campaign={camp}
              isRegistered={isRegistered}
              isRsvpLoading={rsvpMutation.isPending && (rsvpMutation.variables as any)?.id === camp._id}
              onPress={() => navigation.navigate('CampaignDetail', { id: camp._id })}
              onRsvpToggle={() => rsvpMutation.mutate({ id: camp._id, isRegistered })}
            />
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: 12 }}>
              <SkeletonCard height={140} />
              <SkeletonCard height={140} />
            </View>
          ) : (
            <EmptyState
              icon="calendar-outline"
              title={activeTab === 'ALL' ? 'No Matching Blood Drives' : 'No Drives RSVP’d Yet'}
              description={
                activeTab === 'ALL'
                  ? 'No community donation camps match your search criteria. Check back soon for new drives!'
                  : 'You have not RSVP’d to any upcoming blood drives yet. Explore upcoming camps to register.'
              }
              actionTitle={activeTab === 'MY' ? 'Explore All Drives' : undefined}
              onAction={activeTab === 'MY' ? () => setActiveTab('ALL') : undefined}
            />
          )
        }
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
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
    marginBottom: 6,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  filterChipScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
});
