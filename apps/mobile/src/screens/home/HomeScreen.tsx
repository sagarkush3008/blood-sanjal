import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useAuthStore } from '../../store/authStore';
import { useDonationStore } from '../../store/donationStore';
import { AuthAPI } from '../../api/auth.api';
import { NotificationsAPI } from '../../api/notifications.api';
import { DonorsAPI } from '../../api/donors.api';
import { DonationsAPI } from '../../api/donations.api';
import { BloodRequestsAPI } from '../../api/requests.api';
import { RequestCard } from '../../components/requests/RequestCard';
import { RecordDonationModal } from '../../components/donate/RecordDonationModal';
import { colors } from '../../theme';
import { cleanLocationName } from '../../utils/locationHelper';

const { width } = Dimensions.get('window');

// 1. Find Donors Icon (User uploaded custom icon)
const FindDonorsIcon = () => (
  <Image
    source={require('../../../assets/icons/find_donors.png')}
    style={{ width: 46, height: 46 }}
    resizeMode="contain"
  />
);

// 2. Donate Icon (User uploaded custom icon)
const DonateIcon = () => (
  <Image
    source={require('../../../assets/icons/donate.png')}
    style={{ width: 46, height: 46 }}
    resizeMode="contain"
  />
);

// 3. Blood Bank Icon (User uploaded custom icon)
const BloodBankIcon = () => (
  <Image
    source={require('../../../assets/icons/blood_bank.png')}
    style={{ width: 46, height: 46 }}
    resizeMode="contain"
  />
);

// 4. Support Icon (User uploaded custom icon)
const SupportIcon = () => (
  <Image
    source={require('../../../assets/icons/support.png')}
    style={{ width: 46, height: 46 }}
    resizeMode="contain"
  />
);

// 5. Blood Request Icon (User uploaded custom icon)
const BloodRequestIcon = () => (
  <Image
    source={require('../../../assets/icons/blood_request.png')}
    style={{ width: 46, height: 46 }}
    resizeMode="contain"
  />
);

// 6. More Icon (User uploaded custom icon)
const MoreGridIcon = () => (
  <Image
    source={require('../../../assets/icons/more.png')}
    style={{ width: 46, height: 46 }}
    resizeMode="contain"
  />
);

export const HomeScreen = () => {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Live /me Profile
  const { data: meProfile, refetch: refetchMe } = useQuery({
    queryKey: ['me'],
    queryFn: () => AuthAPI.getCurrentUser().then((res) => res.data?.data || res.data),
    initialData: user,
  });

  // Live Donor Profile
  const { data: donorProfile, refetch: refetchDonor } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => DonorsAPI.getMyProfile().then((res) => res.data?.data || res.data).catch(() => null),
  });

  // Unread Notifications Count
  const { data: notificationsData, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () =>
      NotificationsAPI.list({ isRead: false }).then((res) => res.data?.data || res.data),
  });

  const { data: requestsData } = useQuery({
    queryKey: ['blood-requests', 'home-urgent'],
    queryFn: () => BloodRequestsAPI.list({ limit: 3 }).then(res => res.data?.data || res.data),
  });
  const urgentRequests = Array.isArray(requestsData) ? requestsData.slice(0, 3) : (requestsData?.requests || []).slice(0, 3);

  const onRefresh = () => {
    refetchMe();
    refetchDonor();
    refetchNotifications();
  };

  const unreadCount = Array.isArray(notificationsData)
    ? notificationsData.length
    : notificationsData?.total || 0;

  const rawDisplayName = meProfile?.name || user?.name || 'Sagar';
  const displayName = rawDisplayName.replace(/\s*\((?:Donor|Recipient).*?\)/gi, '').trim() || rawDisplayName;
  const firstName = displayName.split(' ')[0];
  
  const locationText = cleanLocationName(meProfile?.cityId || user?.cityId, meProfile?.provinceId);
  
  const bloodGroup = meProfile?.bloodGroup || donorProfile?.bloodGroup || 'O+';
  const liveStoreDonations = useDonationStore((s) => s.totalDonations);
  const totalDonations = liveStoreDonations !== null ? liveStoreDonations : (donorProfile?.totalDonations ?? meProfile?.totalDonations ?? user?.totalDonations ?? 0);
  
  // Synchronize cooldown store with authenticated user ID
  const syncCooldown = useDonationStore((s) => s.syncCooldown);
  const storeNextEligible = useDonationStore((s) => s.nextEligibleDate);
  const storeLastDonation = useDonationStore((s) => s.lastDonationDate);

  useEffect(() => {
    if (user?._id || user?.id) {
      syncCooldown(user._id || user.id);
    }
  }, [user?._id, user?.id, syncCooldown]);

  // 1-second interval for real-time live countdown ticking and 0ms automatic swap upon expiration
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [isResettingCooldown, setIsResettingCooldown] = useState(false);

  // Determine effective next eligible date from Zustand store or live profile (Medical Cooldown ONLY)
  const effectiveNextEligibleRaw = useMemo(() => {
    // If backend profile has explicitly loaded and has NO cooldown dates, clear any lingering local store
    if (donorProfile && !donorProfile.next_eligible_date && !donorProfile.reminderDate && !donorProfile.lastDonationDate) {
      return null;
    }
    if (storeNextEligible) return storeNextEligible;
    if (donorProfile?.next_eligible_date) return donorProfile.next_eligible_date;
    if (donorProfile?.reminderDate) return donorProfile.reminderDate;
    // Fallback: If lastDonationDate exists, compute lastDonationDate + 90 days
    const lastDateRaw = donorProfile?.lastDonationDate || storeLastDonation;
    if (lastDateRaw) {
      const parsedLast = new Date(lastDateRaw).getTime();
      if (!isNaN(parsedLast)) {
        return new Date(parsedLast + 90 * 24 * 60 * 60 * 1000).toISOString();
      }
    }
    return null;
  }, [storeNextEligible, donorProfile, storeLastDonation]);

  const handleResetCooldown = () => {
    Alert.alert(
      'Reset Recovery Cooldown?',
      'This will clear your 90-day recovery cooldown so you can test and record a blood donation again immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Now',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsResettingCooldown(true);
              await DonationsAPI.resetCooldown();
              const currentUserId = user?._id || user?.id;
              await useDonationStore.getState().clearCooldown(currentUserId);
              await Promise.all([refetchMe(), refetchDonor()]);
              Alert.alert('Cooldown Cleared', 'You can now fill the donation form again!');
            } catch (err: any) {
              Alert.alert('Reset Failed', err?.response?.data?.error?.message || err?.message || 'Could not reset cooldown');
            } finally {
              setIsResettingCooldown(false);
            }
          },
        },
      ]
    );
  };

  // Effective last donation date
  const effectiveLastDonationRaw = donorProfile?.lastDonationDate || storeLastDonation || null;

  let lastDonatedDate = 'N/A';
  if (effectiveLastDonationRaw) {
    const d = new Date(effectiveLastDonationRaw);
    if (!isNaN(d.getTime())) {
      lastDonatedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }

  // =========================================================================
  // MEDICAL COOLDOWN & ELIGIBILITY EVALUATION (Strict State Separation)
  // =========================================================================
  // isEligibleToDonate: true if next_eligible_date is null, undefined, or in the past compared to current date
  const { isEligibleToDonate, nextEligibleTime, countdown } = useMemo(() => {
    if (!effectiveNextEligibleRaw) {
      return {
        isEligibleToDonate: true,
        nextEligibleTime: null,
        countdown: { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 },
      };
    }

    const targetDate = new Date(effectiveNextEligibleRaw);
    const targetMs = targetDate.getTime();
    if (isNaN(targetMs)) {
      return {
        isEligibleToDonate: true,
        nextEligibleTime: null,
        countdown: { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 },
      };
    }

    const diffMs = targetMs - currentTime;
    if (diffMs <= 0) {
      // Cooldown has expired: User is eligible to donate
      return {
        isEligibleToDonate: true,
        nextEligibleTime: targetMs,
        countdown: { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 },
      };
    }

    // Cooldown is active: User is ineligible to donate
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return {
      isEligibleToDonate: false,
      nextEligibleTime: targetMs,
      countdown: { days, hours, minutes, seconds, totalMs: diffMs },
    };
  }, [effectiveNextEligibleRaw, currentTime]);

  const formattedNextEligibleDate = useMemo(() => {
    if (!nextEligibleTime) return 'Today';
    const d = new Date(nextEligibleTime);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  }, [nextEligibleTime]);

  const formattedLastDonation = useMemo(() => {
    if (!effectiveLastDonationRaw) return 'None recorded';
    const d = new Date(effectiveLastDonationRaw);
    if (isNaN(d.getTime())) return 'None recorded';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  }, [effectiveLastDonationRaw]);

  const badgeText = isEligibleToDonate ? 'Eligible to Donate' : `${countdown.days} Days Left`;

  // =========================================================================
  // 1. STRICTLY ISOLATED MANUAL AVAILABILITY STATE
  // =========================================================================
  // CRITICAL ENFORCEMENT: Hard-bound ONLY to dedicated manual inactive state variables.
  // 0% access to donation cooldown variables (lastDonationDate, next_eligible_date).
  // If the user's manual pause state is null/false, this specific UI section must remain hidden or show 'Active', regardless of any recent blood donations.
  const manualAvailability = donorProfile?.manualAvailabilityStatus;
  const isExplicitlyManualInactive =
    manualAvailability === 'INACTIVE' ||
    donorProfile?.manualPaused === true ||
    (donorProfile?.donorStatus === 'INACTIVE' &&
      donorProfile?.donorStatus !== 'RESTING' &&
      donorProfile?.donorStatus !== 'UNAVAILABLE');

  // Dedicated manual pause timestamp (strictly decoupled from next_eligible_date/reminderDate)
  let manualInactiveUntilDate: Date | null = null;
  if (isExplicitlyManualInactive) {
    if (donorProfile?.manualInactiveUntil) {
      manualInactiveUntilDate = new Date(donorProfile.manualInactiveUntil);
    } else if (
      donorProfile?.inactiveUntil &&
      (!effectiveNextEligibleRaw || donorProfile.inactiveUntil !== effectiveNextEligibleRaw) &&
      (!effectiveLastDonationRaw || (new Date(donorProfile.inactiveUntil).getTime() - new Date(effectiveLastDonationRaw).getTime()) < 80 * 86400000)
    ) {
      // Safe fallback ONLY if inactiveUntil is NOT the 90-day medical cooldown date
      manualInactiveUntilDate = new Date(donorProfile.inactiveUntil);
    }
  }

  const isAvailable = !isExplicitlyManualInactive;
  
  let relativeText: string | null = null;
  let exactTimeText: string | null = null;
  
  if (isExplicitlyManualInactive && manualInactiveUntilDate && !isNaN(manualInactiveUntilDate.getTime())) {
    const now = new Date();
    const diffMs = manualInactiveUntilDate.getTime() - now.getTime();
    
    if (diffMs > 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) {
        relativeText = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
      } else if (diffHours > 0) {
        relativeText = `${diffHours} hr${diffHours > 1 ? 's' : ''}`;
      } else {
        relativeText = `< 1 hr`;
      }
      
      const timeStr = manualInactiveUntilDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const dateStr = manualInactiveUntilDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      exactTimeText = `${dateStr}, ${timeStr}`;
    } else {
       relativeText = 'Shortly';
       exactTimeText = 'Any moment now';
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER STRIP */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Image 
              source={require('../../../assets/logo.png')} 
              style={styles.logoImage} 
              resizeMode="contain" 
            />
          </View>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={styles.brandTitle} numberOfLines={1}>BLOOD SANJAL</Text>
            <Text style={styles.brandTagline} numberOfLines={1}>Connecting People. Saving Lives.</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Notifications')} 
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <Feather name="bell" size={20} color="#1E293B" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => (navigation as any).toggleDrawer()} 
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <Feather name="menu" size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false} 
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* GREETING & LOCATION */}
        <View style={styles.greetingRow}>
          <Text style={styles.greetingText}>
            Hello, <Text style={{ fontFamily: 'Inter_800ExtraBold', color: '#0F172A' }}>{firstName}</Text> 👋 Thank you for being a lifesaver 💖
          </Text>
          <TouchableOpacity 
            style={styles.locationPill}
            onPress={() => navigation.navigate('Profile', { screen: 'EditProfile' })}
            activeOpacity={0.7}
          >
            <Feather name="map-pin" size={12} color="#DC2626" />
            <Text style={styles.locationText} numberOfLines={1}>{locationText}</Text>
          </TouchableOpacity>
        </View>

        {/* MAIN DONOR CARD */}
        <LinearGradient
          colors={['#991B1B', '#7F1D1D', '#450A0A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.donorCard}
        >
          <View style={styles.donorCardTop}>
            <View style={styles.bloodGroupSquare}>
              <Text style={styles.bloodGroupText}>{bloodGroup}</Text>
            </View>
            <View style={styles.donorCardInfo}>
              <Text style={styles.donorName} numberOfLines={1} ellipsizeMode="tail">
                {displayName}
              </Text>
              <TouchableOpacity 
                style={styles.donorLocationRow}
                onPress={() => navigation.navigate('Profile', { screen: 'EditProfile' })}
                activeOpacity={0.7}
              >
                <Feather name="map-pin" size={12} color="#FCA5A5" />
                <Text style={styles.donorLocationText}>{locationText}</Text>
              </TouchableOpacity>
              <View>
                <TouchableOpacity 
                  style={styles.statusPill}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('DonorAvailability')}
                >
                  <View style={[styles.statusDot, { backgroundColor: isAvailable ? '#22C55E' : '#EF4444' }]} />
                  <Text style={styles.statusText}>{isAvailable ? 'Active' : 'Inactive'}</Text>
                  <Feather name="edit-2" size={12} color="#64748B" style={{ marginLeft: 2 }} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* PREMIUM INACTIVE CARD (Replaces Stats when Inactive to keep card size identical) */}
          {!isAvailable ? (
            <View style={[styles.inactivePremiumBox, { marginTop: 24 }]}>
               <View style={styles.inactivePremiumHeader}>
                 <View style={styles.inactiveHeaderLeft}>
                   <Feather name="moon" size={13} color="#FCA5A5" />
                   <Text style={styles.inactivePremiumTitle} numberOfLines={1}>
                     Temporarily Paused
                   </Text>
                 </View>
                 <TouchableOpacity 
                   onPress={() => navigation.navigate('DonorAvailability')}
                   hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                 >
                   <Text style={styles.inactivePremiumAction}>Change</Text>
                 </TouchableOpacity>
               </View>

               {relativeText && (
                 <View style={styles.returnTimeCenteredBox}>
                   <Text style={styles.returnTimeLabel}>RETURNING IN</Text>
                   <Text style={styles.returnTimeValueLarge}>{relativeText}</Text>
                 </View>
               )}
            </View>
          ) : (
            <View style={styles.donorStatsBox}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>TOTAL DONATIONS</Text>
                <Text style={styles.statValue}>{totalDonations} {totalDonations === 1 ? 'Time' : 'Times'}</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>LAST DONATED</Text>
                <Text style={styles.statValue}>{lastDonatedDate}</Text>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* ================================================================= */}
        {/* STRICT CONDITIONAL RENDERING: ELIGIBLE vs ACTIVE COOLDOWN TIMER   */}
        {/* ================================================================= */}
        {isEligibleToDonate ? (
          /* STATE A: ELIGIBLE TO DONATE -> RENDER RECORD DONATION BUTTON */
          <View style={styles.eligibleCard}>
            <View style={styles.eligibleCardHeader}>
              <View style={styles.eligibleStatusPill}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text style={styles.eligibleStatusText}>Eligible to Donate</Text>
              </View>
              <View style={styles.bloodTypePill}>
                <Ionicons name="water" size={11} color="#DC2626" />
                <Text style={styles.bloodTypePillText}>{bloodGroup}</Text>
              </View>
            </View>

            <View style={styles.eligibleCardBody}>
              <Text style={styles.eligibleCardTitle}>Ready to Save a Life Today?</Text>
              <Text style={styles.eligibleCardSubtitle}>
                {effectiveLastDonationRaw
                  ? `Your 90-day recovery period is complete (Last donated: ${formattedLastDonation}). You are medically clear to donate blood.`
                  : 'You are eligible to donate whole blood. Record your voluntary donation to keep your lifesaver history updated.'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.recordDonationPrimaryBtn}
              onPress={() => setRecordModalVisible(true)}
              activeOpacity={0.85}
            >
              <View style={styles.recordDonationIconCircle}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.recordDonationPrimaryBtnText}>Record Blood Donation</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>
        ) : (
          /* STATE B: INELIGIBLE -> RENDER ACTIVE 90-DAY DIGITAL COUNTDOWN TIMER */
          <View style={styles.activeTimerCard}>
            <View style={styles.timerHeaderRow}>
              <View style={styles.timerBadgePill}>
                <Ionicons name="time" size={13} color="#D97706" />
                <Text style={styles.timerBadgePillText}>90-Day Cooldown Active</Text>
              </View>
              <Text style={styles.timerNextDateText}>
                Eligible: {formattedNextEligibleDate}
              </Text>
            </View>

            <Text style={styles.timerCardTitle}>Recovery Cooldown in Progress</Text>
            <Text style={styles.timerCardSubtitle}>
              To protect donor health and adhere to medical protocols, your next donation window opens in:
            </Text>

            {/* 4-PART DIGITAL COUNTDOWN TIMER (Days, Hours, Minutes, Seconds) */}
            <View style={styles.countdownBoxesContainer}>
              <View style={styles.countdownBox}>
                <Text style={styles.countdownDigitText}>
                  {String(countdown.days).padStart(2, '0')}
                </Text>
                <Text style={styles.countdownUnitText}>DAYS</Text>
              </View>
              <Text style={styles.countdownSeparatorText}>:</Text>

              <View style={styles.countdownBox}>
                <Text style={styles.countdownDigitText}>
                  {String(countdown.hours).padStart(2, '0')}
                </Text>
                <Text style={styles.countdownUnitText}>HOURS</Text>
              </View>
              <Text style={styles.countdownSeparatorText}>:</Text>

              <View style={styles.countdownBox}>
                <Text style={styles.countdownDigitText}>
                  {String(countdown.minutes).padStart(2, '0')}
                </Text>
                <Text style={styles.countdownUnitText}>MINS</Text>
              </View>
              <Text style={styles.countdownSeparatorText}>:</Text>

              <View style={styles.countdownBox}>
                <Text style={styles.countdownDigitText}>
                  {String(countdown.seconds).padStart(2, '0')}
                </Text>
                <Text style={styles.countdownUnitText}>SECS</Text>
              </View>
            </View>

            <View style={styles.timerFooterRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 }}>
                <Ionicons name="shield-checkmark" size={14} color="#059669" />
                <Text style={styles.timerFooterText} numberOfLines={1}>
                  Last: {formattedLastDonation}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.resetCooldownPill}
                onPress={handleResetCooldown}
                disabled={isResettingCooldown}
                activeOpacity={0.7}
              >
                <Feather name="refresh-cw" size={11} color="#DC2626" />
                <Text style={styles.resetCooldownPillText}>
                  {isResettingCooldown ? 'Resetting...' : 'Reset Cooldown'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* QUICK ACTIONS */}
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {/* 1. Find Donors */}
          <TouchableOpacity 
            style={styles.quickActionItem} 
            onPress={() => navigation.navigate('FindBlood')}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionCircle}>
              <FindDonorsIcon />
            </View>
            <Text style={styles.quickActionLabel}>Find Donors</Text>
          </TouchableOpacity>

          {/* 2. Donate */}
          <TouchableOpacity 
            style={styles.quickActionItem} 
            onPress={() => {
              if (isEligibleToDonate) {
                setRecordModalVisible(true);
              } else {
                Alert.alert(
                  'Cooldown Active ⏳',
                  `You are currently on a 90-day medical recovery cooldown until ${formattedNextEligibleDate} (${countdown.days}d ${countdown.hours}h remaining). During cooldown, new donation entries are locked.`
                );
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionCircle}>
              <DonateIcon />
            </View>
            <Text style={styles.quickActionLabel}>Donate</Text>
          </TouchableOpacity>

          {/* 3. Blood Bank */}
          <TouchableOpacity 
            style={styles.quickActionItem} 
            onPress={() => navigation.navigate('FindBlood')}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionCircle}>
              <BloodBankIcon />
            </View>
            <Text style={styles.quickActionLabel}>Blood Bank</Text>
          </TouchableOpacity>

          {/* 4. Support */}
          <TouchableOpacity 
            style={styles.quickActionItem} 
            onPress={() => navigation.navigate('Profile', { screen: 'SupportPlatform' })}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionCircle}>
              <SupportIcon />
            </View>
            <Text style={styles.quickActionLabel}>Support</Text>
          </TouchableOpacity>

          {/* 5. Blood Request */}
          <TouchableOpacity 
            style={styles.quickActionItem} 
            onPress={() => navigation.navigate('CreateRequest')}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionCircle}>
              <BloodRequestIcon />
            </View>
            <Text style={styles.quickActionLabel}>Blood Request</Text>
          </TouchableOpacity>

          {/* 6. More */}
          <TouchableOpacity 
            style={styles.quickActionItem} 
            onPress={() => (navigation as any).toggleDrawer()}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionCircle}>
              <MoreGridIcon />
            </View>
            <Text style={styles.quickActionLabel}>More</Text>
          </TouchableOpacity>
        </View>

        {/* URGENT BLOOD REQUESTS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Urgent Blood Requests</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Requests')}>
            <Text style={styles.viewAllText}>View All ({urgentRequests.length || 12}) {'>'}</Text>
          </TouchableOpacity>
        </View>

        {urgentRequests.length > 0 ? (
          urgentRequests.map((item: any) => (
            <RequestCard
              key={item._id || item.id}
              id={item._id || item.id}
              bloodGroup={item.bloodGroup}
              patientName={item.patientName || 'Patient in Need'}
              location={cleanLocationName(item.hospitalName || item.hospitalLocation?.address || 'Hospital')}
              unitsRequired={item.unitsRequired || 1}
              urgency={item.urgency || 'NORMAL'}
              status={item.status || 'ACTIVE'}
              details={item.additionalInfo}
              onPress={() => navigation.navigate('RequestDetail', { id: item._id || item.id })}
            />
          ))
        ) : (
          <View style={{ padding: 20, alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16 }}>
             <Text style={{ color: '#64748B' }}>No urgent requests right now.</Text>
          </View>
        )}

        {/* ACTIVE VOLUNTARY DONORS INFO CARD */}
        <View style={styles.volunteersBox}>
          <Text style={styles.volunteersTitle}>Active Voluntary Donors in Birgunj & Parsa</Text>
          <View style={styles.volunteersGrid}>
             {[
               { bg: 'A+', count: 11 },
               { bg: 'B+', count: 15 },
               { bg: 'AB+', count: 19 },
               { bg: 'O-', count: 7 },
             ].map((grp) => (
               <View key={grp.bg} style={styles.volunteerItem}>
                  <View style={styles.volunteerPill}>
                     <Ionicons name="water" size={10} color="#FFF" style={{marginRight: 2}}/>
                     <Text style={styles.volunteerPillText}>{grp.bg}</Text>
                  </View>
                  <Text style={styles.volunteerCount}>{grp.count}</Text>
                  <Text style={styles.volunteerSub}>Donors</Text>
               </View>
             ))}
          </View>
          <View style={[styles.volunteerItem, { alignSelf: 'center', marginTop: 12, paddingHorizontal: 40, paddingVertical: 12, backgroundColor: '#F8FAFC', borderRadius: 12 }]}>
             <View style={styles.volunteerPill}>
                 <Ionicons name="water" size={10} color="#FFF" style={{marginRight: 2}}/>
                 <Text style={styles.volunteerPillText}>O+</Text>
             </View>
             <Text style={styles.volunteerCount}>4</Text>
             <Text style={styles.volunteerSub}>Donors</Text>
          </View>
        </View>

        {/* FEATURED DONATION DRIVES */}
        <Text style={[styles.sectionTitle, { marginTop: 24, fontSize: 11 }]}>FEATURED DONATION DRIVES</Text>
        <View style={styles.campCard}>
           <View style={styles.campHeader}>
              <View style={styles.campBadge}><Text style={styles.campBadgeText}>UPCOMING CAMP</Text></View>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                 <Feather name="users" size={12} color="#3B82F6"/>
                 <Text style={{fontSize: 12, color: '#3B82F6', fontFamily: 'Inter_600SemiBold'}}>2 Attending</Text>
              </View>
           </View>
           <Text style={styles.campTitle}>Birgunj Mega Blood Donation Drive 2026</Text>
           <Text style={styles.campOrganizer}>Youth Red Cross Circle Birgunj & Blood Sanjal</Text>
           
           <View style={styles.campInfoRow}>
              <Feather name="calendar" size={12} color="#DC2626" style={{marginTop: 2}} />
              <Text style={styles.campInfoText}><Text style={{fontFamily: 'Inter_700Bold'}}>2026-05-08</Text> (09:00 AM - 04:00 PM)</Text>
           </View>
           <View style={styles.campInfoRow}>
              <Feather name="map-pin" size={12} color="#64748B" style={{marginTop: 2}} />
              <Text style={styles.campInfoText}>Narayani Hospital Blood Bank Premises, Birgunj Metropolitan City, Parsa</Text>
           </View>

           <Text style={styles.campBloodTitle}>BLOOD GROUPS NEEDED</Text>
           <View style={styles.campBloodGrid}>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+'].map(bg => (
                <View key={bg} style={styles.campBloodTinyPill}>
                  <Ionicons name="water" size={8} color="#DC2626" style={{marginRight: 2}}/>
                  <Text style={styles.campBloodTinyText}>{bg}</Text>
                </View>
              ))}
           </View>
           
           <View style={styles.campFooter}>
             <Text style={styles.campFooterText}>Let's donate with forces Birgunj! Invite friends</Text>
             <TouchableOpacity style={styles.campActionBtn}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#059669" style={{marginRight: 4}}/>
                <Text style={styles.campActionText}>I'll Attend this Camp</Text>
             </TouchableOpacity>
           </View>
        </View>

        {/* INVITE FRIEND BANNER */}
        <LinearGradient colors={['#B91C1C', '#7F1D1D']} style={styles.inviteBanner}>
          <View style={{flex: 1, paddingRight: 12}}>
            <Text style={styles.inviteTitle}>Know someone who can donate blood?</Text>
            <Text style={styles.inviteSub}>Invite friends and family in Birgunj to join Blood Sanjal.</Text>
          </View>
          <TouchableOpacity style={styles.inviteBtn}>
             <Ionicons name="share-social-outline" size={16} color="#DC2626" style={{marginRight: 6}}/>
             <Text style={styles.inviteBtnText}>Invite a friend</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* NON-COMMERCIAL NOTICE */}
        <View style={styles.noticeBox}>
           <Ionicons name="shield-checkmark-outline" size={24} color="#DC2626" style={{marginRight: 12}} />
           <View style={{flex: 1}}>
              <Text style={styles.noticeTitle}>Voluntary & Non-Commercial Platform</Text>
              <Text style={styles.noticeSub}>Blood Sanjal connects voluntary donors with blood banks across Nepal. Selling or purchasing blood is strictly illegal under Nepalese law.</Text>
           </View>
        </View>

        <View style={{height: 40}} />
      </ScrollView>

      {/* RECORD DONATION MODAL (Strictly accessible ONLY when isEligibleToDonate is true) */}
      {isEligibleToDonate && (
        <RecordDonationModal
          visible={recordModalVisible}
          onClose={() => setRecordModalVisible(false)}
          onSuccess={() => {
            setRecordModalVisible(false);
            refetchDonor();
            refetchMe();
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7FA' },
  header: { 
    width: '100%',
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingTop: 10, 
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 8 },
  logoBox: { width: 58, height: 58, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  logoImage: { width: '100%', height: '100%' },
  brandTitle: { fontSize: 17, fontFamily: 'Inter_900Black', color: '#0F172A', letterSpacing: -0.4 },
  brandTagline: { fontSize: 10.5, color: '#64748B', marginTop: 2, fontFamily: 'Inter_500Medium' },
  
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center', flexShrink: 0 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', position: 'relative', borderWidth: 1, borderColor: '#E2E8F0' },
  notificationBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  notificationBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 16 },

  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greetingText: { fontSize: 13, color: '#475569', flex: 1, paddingRight: 10, lineHeight: 18, fontFamily: 'Inter_500Medium' },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', maxWidth: 180 },
  locationText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#64748B', flexShrink: 1 },

  donorCard: { borderRadius: 24, padding: 24, marginBottom: 24, shadowColor: '#991B1B', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  donorCardTop: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  bloodGroupSquare: { width: 68, height: 68, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  bloodGroupText: { fontSize: 32, fontFamily: 'Inter_900Black', color: '#DC2626' },
  donorCardInfo: { flex: 1, justifyContent: 'center' },
  donorName: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#FFFFFF', marginBottom: 4, letterSpacing: -0.3 },
  donorLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  donorLocationText: { fontSize: 13, color: '#FECACA', fontFamily: 'Inter_500Medium' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#0F172A' },
  
  inactivePremiumBox: { backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  inactivePremiumHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  inactiveHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 },
  inactivePremiumTitle: { fontSize: 12, fontFamily: 'Inter_800ExtraBold', color: '#FCA5A5', letterSpacing: 0.5 },
  inactivePremiumAction: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#FFFFFF', textDecorationLine: 'underline', paddingLeft: 8 },
  returnTimeCenteredBox: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  returnTimeLabel: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', color: '#FCA5A5', marginBottom: 4, letterSpacing: 0.8 },
  returnTimeValueLarge: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#FFFFFF', letterSpacing: -0.3, textAlign: 'center' },

  donorStatsBox: { flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 16, padding: 16, marginTop: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  statCol: { flex: 1 },
  statLabel: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', color: '#FECACA', letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#FFFFFF' },

  // =========================================================================
  // ELIGIBLE & COUNTDOWN TIMER STYLES
  // =========================================================================
  eligibleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  eligibleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eligibleStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  eligibleStatusText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#065F46',
  },
  bloodTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  bloodTypePillText: {
    fontSize: 12,
    fontFamily: 'Inter_800ExtraBold',
    color: '#DC2626',
  },
  eligibleCardBody: {
    marginBottom: 16,
  },
  eligibleCardTitle: {
    fontSize: 16,
    fontFamily: 'Inter_800ExtraBold',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  eligibleCardSubtitle: {
    fontSize: 12.5,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    lineHeight: 18,
  },
  recordDonationPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  recordDonationIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  recordDonationPrimaryBtnText: {
    fontSize: 14.5,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  activeTimerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  timerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timerBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  timerBadgePillText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#92400E',
  },
  timerNextDateText: {
    fontSize: 11.5,
    fontFamily: 'Inter_600SemiBold',
    color: '#B45309',
  },
  timerCardTitle: {
    fontSize: 15.5,
    fontFamily: 'Inter_800ExtraBold',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  timerCardSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 14,
  },
  countdownBoxesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  countdownBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  countdownDigitText: {
    fontSize: 20,
    fontFamily: 'Inter_900Black',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  countdownUnitText: {
    fontSize: 9.5,
    fontFamily: 'Inter_700Bold',
    color: '#64748B',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  countdownSeparatorText: {
    fontSize: 18,
    fontFamily: 'Inter_900Black',
    color: '#CBD5E1',
    marginHorizontal: 3,
    marginBottom: 12,
  },
  timerFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  timerFooterText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#64748B',
  },
  resetCooldownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  resetCooldownPillText: {
    fontSize: 11.5,
    fontFamily: 'Inter_600SemiBold',
    color: '#DC2626',
  },

  quickActionsTitle: {
    fontSize: 14.5,
    fontFamily: 'Inter_700Bold',
    color: '#64748B',
    marginBottom: 16,
    marginLeft: 2,
    letterSpacing: -0.2,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickActionItem: {
    width: (width - 40 - 24) / 3,
    alignItems: 'center',
    marginBottom: 20,
  },
  quickActionCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quickActionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#1E293B',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: -0.2,
  },

  sectionTitle: { fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: '#64748B', letterSpacing: 1, marginBottom: 16, marginLeft: 4 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 16 },
  viewAllText: { fontSize: 13, fontFamily: 'Inter_800ExtraBold', color: '#DC2626', letterSpacing: 0.5 },
  
  volunteersBox: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  volunteersTitle: { fontSize: 13, fontFamily: 'Inter_800ExtraBold', color: '#0F172A', marginBottom: 16, textAlign: 'center' },
  volunteersGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  volunteerItem: { alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, minWidth: 60 },
  volunteerPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DC2626', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 8 },
  volunteerPillText: { color: '#FFF', fontSize: 11, fontFamily: 'Inter_800ExtraBold' },
  volunteerCount: { fontSize: 16, fontFamily: 'Inter_900Black', color: '#0F172A' },
  volunteerSub: { fontSize: 9, color: '#64748B', fontFamily: 'Inter_700Bold', textTransform: 'uppercase', marginTop: 2 },
  
  campCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  campHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  campBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  campBadgeText: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', color: '#059669', letterSpacing: 0.5 },
  campTitle: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#0F172A', marginBottom: 4 },
  campOrganizer: { fontSize: 12, color: '#475569', marginBottom: 12, fontFamily: 'Inter_500Medium' },
  campInfoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, paddingRight: 20, gap: 6 },
  campInfoText: { fontSize: 12, color: '#475569', lineHeight: 18, fontFamily: 'Inter_400Regular' },
  campBloodTitle: { fontSize: 9, fontFamily: 'Inter_800ExtraBold', color: '#64748B', letterSpacing: 0.5, marginTop: 12, marginBottom: 8 },
  campBloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  campBloodTinyPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  campBloodTinyText: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', color: '#DC2626' },
  campFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  campFooterText: { flex: 1, fontSize: 10, color: '#94A3B8', paddingRight: 10, fontFamily: 'Inter_400Regular' },
  campActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#A7F3D0' },
  campActionText: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', color: '#059669' },

  inviteBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginTop: 24 },
  inviteTitle: { fontSize: 14, fontFamily: 'Inter_900Black', color: '#FFFFFF', marginBottom: 4 },
  inviteSub: { fontSize: 11, color: '#FECACA', lineHeight: 16, fontFamily: 'Inter_400Regular' },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  inviteBtnText: { fontSize: 12, fontFamily: 'Inter_800ExtraBold', color: '#DC2626' },
  
  noticeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#FECACA' },
  noticeTitle: { fontSize: 12, fontFamily: 'Inter_800ExtraBold', color: '#991B1B', marginBottom: 2 },
  noticeSub: { fontSize: 10, color: '#B91C1C', lineHeight: 14, fontFamily: 'Inter_400Regular' },
});
