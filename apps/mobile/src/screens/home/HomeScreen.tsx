import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { AuthAPI } from '../../api/auth.api';
import { BloodRequestsAPI } from '../../api/requests.api';
import { CampaignsAPI } from '../../api/campaigns.api';
import { NotificationsAPI } from '../../api/notifications.api';
import { MetricsAPI } from '../../api/metrics.api';
import { EmergencyButton, SkeletonCard, StatusBadge, EmptyState } from '../../components/common';
import { SideDrawer } from '../../components/SideDrawer';
import { colors, spacing } from '../../theme';

export const HomeScreen = () => {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [bloodUnitsModalVisible, setBloodUnitsModalVisible] = useState(false);

  // Live /me Profile
  const { data: meProfile, refetch: refetchMe } = useQuery({
    queryKey: ['me'],
    queryFn: () => AuthAPI.getCurrentUser().then((res) => res.data?.data || res.data),
    initialData: user,
  });

  // Live Metrics
  const { data: metrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['platform-metrics'],
    queryFn: () => MetricsAPI.getLiveMetrics(),
  });

  // Live Active & Urgent Blood Requests
  const {
    data: requestsData,
    isLoading: isLoadingRequests,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['blood-requests', 'home'],
    queryFn: () => BloodRequestsAPI.list({ limit: 4 }).then((res) => res.data?.data || res.data),
  });

  // Live Upcoming Campaigns
  const {
    data: campaignsData,
    isLoading: isLoadingCampaigns,
    refetch: refetchCampaigns,
  } = useQuery({
    queryKey: ['campaigns', 'home'],
    queryFn: () => CampaignsAPI.list({ limit: 3 }).then((res) => res.data?.data || res.data),
  });

  // Unread Notifications Count
  const { data: notificationsData, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () =>
      NotificationsAPI.list({ isRead: false }).then((res) => res.data?.data || res.data),
  });

  const onRefresh = () => {
    refetchMe();
    refetchMetrics();
    refetchRequests();
    refetchCampaigns();
    refetchNotifications();
  };

  const activeRequests = Array.isArray(requestsData)
    ? requestsData
    : requestsData?.requests || requestsData?.items || [];

  const upcomingCampaigns = Array.isArray(campaignsData)
    ? campaignsData
    : campaignsData?.campaigns || campaignsData?.items || [];

  const unreadCount = Array.isArray(notificationsData)
    ? notificationsData.length
    : notificationsData?.total || 0;

  const displayName = meProfile?.name || user?.name || 'Friend';
  const firstName = displayName.split(' ')[0];
  const userBloodGroup = meProfile?.bloodGroup || user?.bloodGroup || 'O+';
  const donationCount = meProfile?.donationCount || 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER: Blood Sanjal + Notification */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => setDrawerVisible(true)}
          >
            <Ionicons name="menu" size={26} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.brandRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Home')}
          >
            <View style={styles.brandDrop}>
              <Ionicons name="water" size={18} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.brandTitle}>Blood Sanjal</Text>
              <Text style={styles.brandTagline}>Connecting People. Saving Lives.</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color="#0F172A" />
            {unreadCount > 0 && (
              <View style={styles.badgePill}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* HERO SECTION */}
        <View style={styles.heroCard}>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroGreeting}>Namaste, {firstName}</Text>
            <Text style={styles.heroHeadline}>Find Blood.{'\n'}Help Someone Today.</Text>
            <Text style={styles.heroSubhead}>
              Quickly locate compatible donors across hospitals and cities in Nepal.
            </Text>
          </View>
          <View style={styles.bloodGroupBadge}>
            <Text style={styles.bloodBadgeLabel}>My Group</Text>
            <Text style={styles.bloodBadgeValue}>{userBloodGroup}</Text>
          </View>
        </View>

        {/* PRIMARY ACTIONS: [Find Blood] & [Request Blood] */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardPrimary]}
            onPress={() => navigation.navigate('FindBlood')}
            activeOpacity={0.88}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="search" size={20} color={colors.primary} />
            </View>
            <Text style={styles.actionTitlePrimary}>Find Blood</Text>
            <Text style={styles.actionSubtitlePrimary}>Search nearby verified donors</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardSecondary]}
            onPress={() => navigation.navigate('CreateRequest')}
            activeOpacity={0.88}
          >
            <View style={styles.actionIconCircleSecondary}>
              <Ionicons name="add-circle-outline" size={20} color="#0F172A" />
            </View>
            <Text style={styles.actionTitleSecondary}>Request Blood</Text>
            <Text style={styles.actionSubtitleSecondary}>Submit urgent patient request</Text>
          </TouchableOpacity>
        </View>

        {/* EMERGENCY BLOOD REQUEST BUTTON */}
        <View style={styles.emergencySection}>
          <EmergencyButton
            title="Emergency Blood Request"
            onConfirm={() => navigation.navigate('CreateRequest', { urgency: 'EMERGENCY' })}
          />
        </View>

        {/* LIVE PLATFORM METRICS SUMMARY */}
        <View style={styles.metricsContainer}>
          <TouchableOpacity 
            style={styles.metricItem}
            activeOpacity={0.7}
            onPress={() => setBloodUnitsModalVisible(true)}
          >
            <Text style={styles.metricVal}>{metrics?.availableUnits || 263}</Text>
            <Text style={styles.metricLbl}>Units Available</Text>
          </TouchableOpacity>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>{metrics?.activeDonors || 32}</Text>
            <Text style={styles.metricLbl}>Active Donors</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>{metrics?.bloodBanks || 8}</Text>
            <Text style={styles.metricLbl}>Partner Banks</Text>
          </View>
        </View>

        {/* RECOGNITION & IMPACT CARD */}
        <TouchableOpacity
          style={styles.recognitionCard}
          onPress={() => navigation.navigate('Rewards')}
          activeOpacity={0.9}
        >
          <View style={styles.recognitionIcon}>
            <Ionicons name="ribbon-outline" size={24} color="#D97706" />
          </View>
          <View style={styles.recognitionContent}>
            <Text style={styles.recognitionTitle}>Donor Recognition & Milestones</Text>
            <Text style={styles.recognitionSub}>
              {donationCount > 0
                ? `${donationCount} lifetime donations • View badges and certificates`
                : 'Become an active donor and earn certificates that save lives'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* LIVE ACTIVE BLOOD REQUESTS */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleCol}>
            <Text style={styles.sectionTitle}>Active Blood Requests</Text>
            <Text style={styles.sectionSubtitle}>Patients needing urgent blood right now</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Requests')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {isLoadingRequests ? (
          <SkeletonCard height={90} borderRadius={14} />
        ) : activeRequests.length === 0 ? (
          <EmptyState
            icon="checkmark-circle-outline"
            title="All Blood Demands Fulfilled"
            description="There are no pending blood requests at this moment. You can create a request if you need blood."
            actionTitle="Request Blood"
            onAction={() => navigation.navigate('CreateRequest')}
          />
        ) : (
          activeRequests.map((req: any) => (
            <TouchableOpacity
              key={req._id || req.id}
              style={styles.requestCard}
              onPress={() => navigation.navigate('RequestDetail', { id: req._id || req.id })}
              activeOpacity={0.88}
            >
              <View style={styles.reqBloodBadge}>
                <Text style={styles.reqBloodText}>{req.bloodGroup}</Text>
              </View>

              <View style={styles.reqInfoCol}>
                <View style={styles.reqHospitalRow}>
                  <Text style={styles.reqHospital} numberOfLines={1}>
                    {req.hospital || req.hospitalName || 'Local Hospital'}
                  </Text>
                  <StatusBadge status={req.urgency || req.status || 'ACTIVE'} />
                </View>

                <View style={styles.reqMetaRow}>
                  <Ionicons name="location-outline" size={13} color="#64748B" />
                  <Text style={styles.reqMetaText} numberOfLines={1}>
                    {req.location?.city || req.districtId || 'Nepal'} • {req.units || 1} Unit(s)
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          ))
        )}

        {/* UPCOMING CAMPAIGNS & BLOOD CAMPS */}
        <View style={[styles.sectionHeaderRow, { marginTop: spacing.l }]}>
          <View style={styles.sectionTitleCol}>
            <Text style={styles.sectionTitle}>Blood Donation Camps</Text>
            <Text style={styles.sectionSubtitle}>Community drives organized across Nepal</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Campaigns')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {isLoadingCampaigns ? (
          <SkeletonCard height={90} borderRadius={14} />
        ) : upcomingCampaigns.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No Upcoming Camps"
            description="Check back soon or organize a community blood drive in your area."
          />
        ) : (
          upcomingCampaigns.map((camp: any) => (
            <TouchableOpacity
              key={camp._id || camp.id}
              style={styles.campaignCard}
              onPress={() => navigation.navigate('CampaignDetail', { id: camp._id || camp.id })}
              activeOpacity={0.88}
            >
              <View style={styles.campaignCalendarBadge}>
                <Ionicons name="calendar" size={18} color={colors.primary} />
              </View>
              <View style={styles.campaignInfoCol}>
                <Text style={styles.campaignTitle} numberOfLines={1}>
                  {camp.title}
                </Text>
                <Text style={styles.campaignOrganizer} numberOfLines={1}>
                  Organized by: {camp.organizer || 'Community Organization'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={bloodUnitsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setBloodUnitsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Available Blood Units</Text>
              <TouchableOpacity onPress={() => setBloodUnitsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.bloodGroupRow}>
                <Text style={styles.bloodGroupText}>All Groups (Total)</Text>
                <Text style={styles.bloodGroupVal}>{metrics?.availableUnits || 263} Units</Text>
              </View>
              {metrics?.availableUnitsByGroup && Object.entries(metrics.availableUnitsByGroup).map(([group, count]) => (
                <View key={group} style={styles.bloodGroupRow}>
                  <View style={styles.bloodGroupBadgeSmall}>
                    <Text style={styles.bloodGroupBadgeSmallText}>{group}</Text>
                  </View>
                  <Text style={styles.bloodGroupVal}>{count} Units</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SideDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  menuButton: {
    marginRight: 12,
    padding: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandDrop: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgePill: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  heroGreeting: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroHeadline: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 25,
    marginBottom: 6,
  },
  heroSubhead: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  bloodGroupBadge: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#991B1B',
    textTransform: 'uppercase',
  },
  bloodBadgeValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  actionCardPrimary: {
    backgroundColor: colors.primarySoft,
    borderColor: '#FECACA',
  },
  actionCardSecondary: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionIconCircleSecondary: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionTitlePrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 3,
  },
  actionSubtitlePrimary: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 15,
  },
  actionTitleSecondary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  actionSubtitleSecondary: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 15,
  },
  emergencySection: {
    marginBottom: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricLbl: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  recognitionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 20,
    gap: 12,
  },
  recognitionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recognitionContent: {
    flex: 1,
  },
  recognitionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  recognitionSub: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleCol: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  reqBloodBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  reqBloodText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  reqInfoCol: {
    flex: 1,
  },
  reqHospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reqHospital: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 6,
  },
  reqMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reqMetaText: {
    fontSize: 12,
    color: '#64748B',
  },
  campaignCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  campaignCalendarBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  campaignInfoCol: {
    flex: 1,
  },
  campaignTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  campaignOrganizer: {
    fontSize: 12,
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  bloodGroupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  bloodGroupText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  bloodGroupVal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  bloodGroupBadgeSmall: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  bloodGroupBadgeSmallText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
});
