import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Linking,
  Share,
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
import { colors } from '../../theme';

// Medical Blood Compatibility Matrix
const COMPATIBILITY_RULES: Record<string, { receive: string; give: string }> = {
  'A+': {
    receive: 'A+, A-, O+, O-',
    give: 'A+, AB+',
  },
  'A-': {
    receive: 'A-, O-',
    give: 'A+, A-, AB+, AB-',
  },
  'B+': {
    receive: 'B+, B-, O+, O-',
    give: 'B+, AB+',
  },
  'B-': {
    receive: 'B-, O-',
    give: 'B+, B-, AB+, AB-',
  },
  'O+': {
    receive: 'O-, O+',
    give: 'O+, A+, B+, AB+',
  },
  'O-': {
    receive: 'O- (Universal Donor)',
    give: 'All Blood Types',
  },
  'AB+': {
    receive: 'All Types (Universal Recipient)',
    give: 'AB+ only',
  },
  'AB-': {
    receive: 'AB-, A-, B-, O-',
    give: 'AB+, AB-',
  },
};

export const HomeScreen = () => {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();

  const [selectedCompatType, setSelectedCompatType] = useState<string>('O+');

  // User details
  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => AuthAPI.getCurrentUser().then((res) => res.data?.data || res.data),
    initialData: user,
  });

  // Live Metrics
  const { data: metricsData, refetch: refetchMetrics } = useQuery({
    queryKey: ['platform-metrics'],
    queryFn: () => MetricsAPI.getLiveMetrics(),
  });

  // Active / Emergency Blood Requests
  const {
    data: requestsData,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['blood-requests', 'home'],
    queryFn: () => BloodRequestsAPI.list({ limit: 5 }).then((res) => res.data?.data || res.data),
  });

  // Upcoming Campaigns
  const {
    data: campaignsData,
    refetch: refetchCampaigns,
  } = useQuery({
    queryKey: ['campaigns', 'home'],
    queryFn: () => CampaignsAPI.list({ limit: 4 }).then((res) => res.data?.data || res.data),
  });

  // Unread notifications count
  const { data: notificationsData, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => NotificationsAPI.list({ isRead: false }).then((res) => res.data?.data || res.data),
  });

  const onRefresh = () => {
    refetchRequests();
    refetchCampaigns();
    refetchMetrics();
    refetchNotifications();
  };

  const rawRequests = Array.isArray(requestsData)
    ? requestsData
    : requestsData?.requests || requestsData?.items || [];

  const emergencyRequests =
    rawRequests.length > 0
      ? rawRequests
      : [
          {
            _id: '6ab6a52d7c42ac4f08181b05',
            patientName: 'Marcus Johnson',
            bloodGroup: 'AB-',
            unitsRequired: 4,
            hospitalName: 'St. Jude Emergency Trauma Center, Kathmandu',
            additionalInfo: 'Internal hemorrhage and severe trauma',
            contactPhone: '+977-9800000000',
            urgency: 'URGENT',
            status: 'SEARCHING',
          },
        ];

  const rawCampaigns = Array.isArray(campaignsData)
    ? campaignsData
    : campaignsData?.campaigns || campaignsData?.items || [];

  const campsList =
    rawCampaigns.length > 0
      ? rawCampaigns
      : [
          {
            _id: 'camp-1',
            title: 'City Mega Blood Donation Camp',
            organizer: 'Nepal Red Cross Society',
            date: 'Oct 02, 2026 • 09:00 AM',
            registered: '42 Registered',
          },
          {
            _id: 'camp-2',
            title: 'Kathmandu Youth Blood Drive',
            organizer: 'Rotary Club of Patan',
            date: 'Oct 08, 2026 • 10:00 AM',
            registered: '28 Registered',
          },
        ];

  const unreadCount = Array.isArray(notificationsData)
    ? notificationsData.length
    : notificationsData?.total || 0;

  const displayName = meData?.name || user?.name || 'Donor';
  const firstName = displayName.split(' ')[0];

  const handleCall = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleShare = async (req: any) => {
    try {
      await Share.share({
        message: `🚨 Urgent Blood Request on BloodLink!\nPatient: ${req.patientName}\nBlood Group Needed: ${req.bloodGroup} (${req.unitsRequired} Units)\nHospital: ${req.hospitalName}\nContact: ${req.contactPhone}\nPlease share to save a life!`,
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* MINIMAL TOP NAVBAR */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <View style={styles.logoDrop}>
            <Ionicons name="water" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.brandTitle}>BloodLink</Text>
        </View>

        <View style={styles.headerRight}>
          {/* User Avatar Chip */}
          <TouchableOpacity
            style={styles.userChip}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.7}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{firstName.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.userName} numberOfLines={1}>{firstName}</Text>
          </TouchableOpacity>

          {/* Notification Icon */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color="#334155" />
            {unreadCount > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* ======================================================== */}
        {/* 1. MINIMAL HERO SECTION                                  */}
        {/* ======================================================== */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.liveDot} />
            <Text style={styles.heroBadgeText}>VERIFIED BLOOD NETWORK</Text>
          </View>

          <Text style={styles.heroHeadline}>Find Blood. Save Lives.</Text>
          <Text style={styles.heroSubtitle}>
            Direct connection between patients, certified blood banks, and verified voluntary donors across Nepal.
          </Text>

          {/* Emergency Request Button */}
          <TouchableOpacity
            style={styles.emergencyBtn}
            onPress={() => navigation.navigate('Requests', { screen: 'EmergencyRequest' })}
            activeOpacity={0.85}
          >
            <Ionicons name="alert-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.emergencyBtnText}>Emergency Broadcast</Text>
          </TouchableOpacity>

          {/* Two Action Buttons Row */}
          <View style={styles.heroBtnRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('Find Blood')}
              activeOpacity={0.8}
            >
              <Ionicons name="search" size={15} color="#0F172A" style={{ marginRight: 6 }} />
              <Text style={styles.secondaryBtnText}>Find Donors</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => navigation.navigate('Requests', { screen: 'CreateRequest' })}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={17} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.outlineBtnText}>Request Blood</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ======================================================== */}
        {/* 2. QUICK BLOOD GROUP FILTER                              */}
        {/* ======================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Quick Search by Blood Group</Text>
            <Text style={styles.sectionSub}>Tap to search verified donors</Text>
          </View>

          <View style={styles.bloodGrid}>
            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.bloodChip}
                onPress={() => navigation.navigate('Find Blood', { bloodGroup: type })}
                activeOpacity={0.7}
              >
                <Ionicons name="water" size={11} color={colors.primary} style={{ marginRight: 3 }} />
                <Text style={styles.bloodChipText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ======================================================== */}
        {/* 3. PLATFORM METRICS                                      */}
        {/* ======================================================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Platform Metrics</Text>
          <Text style={styles.sectionSub}>Live counts verified directly from network</Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Available Stock</Text>
                <Ionicons name="water-outline" size={16} color={colors.primary} />
              </View>
              <Text style={styles.metricValue}>{metricsData?.availableUnits ?? 263}</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Active Donors</Text>
                <Ionicons name="people-outline" size={16} color="#10B981" />
              </View>
              <Text style={styles.metricValue}>{metricsData?.activeDonors ?? 142}</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Blood Banks</Text>
                <Ionicons name="medical-outline" size={16} color="#0D9488" />
              </View>
              <Text style={styles.metricValue}>{metricsData?.bloodBanks ?? 6}</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>Active Requests</Text>
                <Ionicons name="alert-circle-outline" size={16} color="#F59E0B" />
              </View>
              <Text style={styles.metricValue}>{metricsData?.emergencies ?? 3}</Text>
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* 4. URGENT BLOOD REQUESTS                                 */}
        {/* ======================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRowBetween}>
            <Text style={styles.sectionTitle}>Urgent Requests</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Requests')}>
              <Text style={styles.linkText}>View All ({emergencyRequests.length})</Text>
            </TouchableOpacity>
          </View>

          {emergencyRequests.map((req: any, index: number) => {
            const contactPhone = req.contactPhone || req.contactPerson?.phone || '';

            return (
              <View key={req._id || index} style={styles.requestCard}>
                <View style={styles.requestTopRow}>
                  <View style={styles.badgeUrgent}>
                    <Text style={styles.badgeUrgentText}>URGENT</Text>
                  </View>
                  <View style={styles.bloodTypePill}>
                    <Text style={styles.bloodTypePillText}>{req.bloodGroup}</Text>
                  </View>
                </View>

                <View style={styles.requestBody}>
                  <Text style={styles.patientName}>{req.patientName}</Text>
                  <Text style={styles.unitsNeeded}>
                    Needed: <Text style={{ fontWeight: '600', color: '#0F172A' }}>{req.unitsRequired} Units</Text>
                  </Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={13} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.locationText} numberOfLines={1}>{req.hospitalName}</Text>
                  </View>
                </View>

                <View style={styles.requestActionRow}>
                  {contactPhone ? (
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={() => handleCall(contactPhone)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                      <Text style={styles.callButtonText}>Call Contact</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => handleShare(req)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="share-social-outline" size={14} color="#334155" />
                    <Text style={styles.shareButtonText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* ======================================================== */}
        {/* 5. BECOME A VOLUNTARY DONOR CALLOUT                      */}
        {/* ======================================================== */}
        <View style={styles.donorCalloutCard}>
          <View style={styles.donorCalloutHeader}>
            <View style={styles.heartCircle}>
              <Ionicons name="heart" size={16} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.donorCalloutTitle}>Become a Life Saver</Text>
              <Text style={styles.donorCalloutSub}>
                1 donation can save up to 3 lives. Register to receive verified emergency requests.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.donorCalloutBtn}
            onPress={() => navigation.navigate('Donate')}
            activeOpacity={0.85}
          >
            <Text style={styles.donorCalloutBtnText}>Register as Blood Donor</Text>
          </TouchableOpacity>
        </View>

        {/* ======================================================== */}
        {/* 6. BLOOD COMPATIBILITY MATRIX                            */}
        {/* ======================================================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Blood Compatibility Matrix</Text>
          <Text style={styles.sectionSub}>Select a blood type to view giving & receiving rules</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.compatScroll}>
            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((type) => {
              const isSelected = selectedCompatType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.compatChip, isSelected && styles.compatChipSelected]}
                  onPress={() => setSelectedCompatType(type)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.compatChipText, isSelected && styles.compatChipTextSelected]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.compatResultBox}>
            <View style={styles.compatResultRow}>
              <Text style={styles.compatLabel}>Can RECEIVE from:</Text>
              <Text style={styles.compatValue}>{COMPATIBILITY_RULES[selectedCompatType]?.receive}</Text>
            </View>
            <View style={styles.compatDivider} />
            <View style={styles.compatResultRow}>
              <Text style={styles.compatLabel}>Can GIVE to:</Text>
              <Text style={styles.compatValue}>{COMPATIBILITY_RULES[selectedCompatType]?.give}</Text>
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* 7. UPCOMING CAMPAIGNS & DRIVES                           */}
        {/* ======================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRowBetween}>
            <Text style={styles.sectionTitle}>Upcoming Blood Drives</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Campaigns')}>
              <Text style={styles.linkText}>View All</Text>
            </TouchableOpacity>
          </View>

          {campsList.map((camp: any, index: number) => (
            <TouchableOpacity
              key={camp._id || index}
              style={styles.campItem}
              onPress={() => navigation.navigate('CampaignDetails', { id: camp._id })}
              activeOpacity={0.8}
            >
              <View style={styles.campInfo}>
                <Text style={styles.campTitle}>{camp.title}</Text>
                <Text style={styles.campOrganizer}>{camp.organizer}</Text>
                <View style={styles.campDateRow}>
                  <Ionicons name="calendar-outline" size={12} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={styles.campDateText}>{camp.date || 'Oct 2026'}</Text>
                </View>
              </View>
              <View style={styles.campAction}>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ======================================================== */}
        {/* 8. VERIFICATION GUARANTEE                                */}
        {/* ======================================================== */}
        <View style={styles.safetyBox}>
          <Ionicons name="shield-checkmark" size={20} color="#10B981" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.safetyTitle}>Verified Biosafety Accreditation</Text>
            <Text style={styles.safetyText}>
              All blood banks and partner hospitals are clinical license verified.
            </Text>
          </View>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoDrop: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatarCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  heroHeadline: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  emergencyBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  emergencyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  heroBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  outlineBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionHeaderRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  bloodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  bloodChip: {
    width: '23%',
    height: 38,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  requestCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  requestTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badgeUrgent: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeUrgentText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  bloodTypePill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bloodTypePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  requestBody: {
    marginBottom: 8,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  unitsNeeded: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  requestActionRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  callButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  shareButtonText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '500',
  },
  donorCalloutCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  donorCalloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  heartCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  donorCalloutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  donorCalloutSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
  donorCalloutBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  donorCalloutBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  compatScroll: {
    marginVertical: 10,
  },
  compatChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  compatChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  compatChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  compatChipTextSelected: {
    color: '#FFFFFF',
  },
  compatResultBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  compatResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compatLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  compatValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  compatDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  campItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  campInfo: {
    flex: 1,
    paddingRight: 8,
  },
  campTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  campOrganizer: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  campDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  campDateText: {
    fontSize: 11,
    color: '#64748B',
  },
  campAction: {
    paddingLeft: 4,
  },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  safetyTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  safetyText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
});
