import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useAuthStore } from '../../store/authStore';
import { AuthAPI } from '../../api/auth.api';
import { NotificationsAPI } from '../../api/notifications.api';
import { DonorsAPI } from '../../api/donors.api';
import { BloodRequestsAPI } from '../../api/requests.api';
import { RequestCard } from '../../components/requests/RequestCard';
import { colors } from '../../theme';
import { cleanLocationName } from '../../utils/locationHelper';

const { width } = Dimensions.get('window');

// 1. Find Donors SVG (Crimson blood drop with magnifying glass)
const FindDonorsIcon = () => (
  <Svg width={38} height={38} viewBox="0 0 36 36" fill="none">
    <Path
      d="M17 5C17 5 8 15.5 8 21.5C8 26.5 12 30.5 17 30.5C18.2 30.5 19.3 30.2 20.3 29.8"
      stroke="#B91C1C"
      strokeWidth={2.4}
      strokeLinecap="round"
    />
    <Path
      d="M20 7.5C21.8 10 24.5 14.5 25.5 18"
      stroke="#B91C1C"
      strokeWidth={2.4}
      strokeLinecap="round"
    />
    <Circle cx={22.5} cy={22.5} r={6.5} stroke="#B91C1C" strokeWidth={2.4} />
    <Path d="M27.5 27.5L32 32" stroke="#B91C1C" strokeWidth={2.6} strokeLinecap="round" />
  </Svg>
);

// 2. Donate SVG (Hand cradling red heart with radiance rays)
const DonateIcon = () => (
  <Svg width={38} height={38} viewBox="0 0 36 36" fill="none">
    <Path d="M14 6L13 4" stroke="#B91C1C" strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M18 4.5V2.5" stroke="#B91C1C" strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M22 6L23 4" stroke="#B91C1C" strokeWidth={1.8} strokeLinecap="round" />
    <Path
      d="M18 17.5C18 17.5 12 13.5 12 10C12 7.8 13.8 6 16 6C17.2 6 18 6.8 18 6.8C18 6.8 18.8 6 20 6C22.2 6 24 7.8 24 10C24 13.5 18 17.5 18 17.5Z"
      fill="#B91C1C"
    />
    <Path
      d="M7 23.5L12 21.5C13.2 21 14.5 21.2 15.5 22L17.5 23.5C18.5 24.2 19.8 24.5 21 24.2L28 22.5C29 22.2 30 22.8 30.2 23.8C30.4 24.8 29.8 25.8 28.8 26L22.5 27.5C21 27.8 19.5 27.5 18.2 26.6L16.5 25.2L12 27L7 25"
      stroke="#B91C1C"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 3. Blood Bank SVG (Classical building with blood drop inside)
const BloodBankIcon = () => (
  <Svg width={38} height={38} viewBox="0 0 36 36" fill="none">
    <Path d="M7 11L18 4L29 11H7Z" stroke="#B91C1C" strokeWidth={2.2} strokeLinejoin="round" />
    <Path d="M6 13H30" stroke="#B91C1C" strokeWidth={2} strokeLinecap="round" />
    <Path d="M8 15V26" stroke="#B91C1C" strokeWidth={2.2} strokeLinecap="round" />
    <Path d="M12 15V26" stroke="#B91C1C" strokeWidth={2} strokeLinecap="round" />
    <Path d="M24 15V26" stroke="#B91C1C" strokeWidth={2} strokeLinecap="round" />
    <Path d="M28 15V26" stroke="#B91C1C" strokeWidth={2.2} strokeLinecap="round" />
    <Path
      d="M18 16C18 16 14.8 20 14.8 21.8C14.8 23.6 16.2 25 18 25C19.8 25 21.2 23.6 21.2 21.8C21.2 20 18 16 18 16Z"
      stroke="#B91C1C"
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
    <Path d="M6 28H30" stroke="#B91C1C" strokeWidth={2.2} strokeLinecap="round" />
    <Path d="M4 31H32" stroke="#B91C1C" strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);

// 4. Support SVG (Heart with white handshake clasp inside)
const SupportIcon = () => (
  <Svg width={38} height={38} viewBox="0 0 36 36" fill="none">
    <Path
      d="M18 31.5C18 31.5 5 22.5 5 13C5 8 9 4.5 13.5 4.5C16.2 4.5 18 6 18 6C18 6 19.8 4.5 22.5 4.5C27 4.5 31 8 31 13C31 22.5 18 31.5 18 31.5Z"
      fill="#B91C1C"
    />
    <Path
      d="M11 16.5L14.5 14L18 17.5L15 20.5L11 16.5Z"
      stroke="#FFFFFF"
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
    <Path
      d="M25 16.5L21.5 14L18 17.5L21 20.5L25 16.5Z"
      stroke="#FFFFFF"
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
    <Path d="M15 17.5L17 19.5" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M21 17.5L19 19.5" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

// 5. Blood Request SVG (Document sheet with horizontal lines & pen signing)
const BloodRequestIcon = () => (
  <Svg width={38} height={38} viewBox="0 0 36 36" fill="none">
    <Path
      d="M9 6C9 4.9 9.9 4 11 4H21L27 10V28C27 29.1 26.1 30 25 30H11C9.9 30 9 29.1 9 28V6Z"
      stroke="#B91C1C"
      strokeWidth={2.2}
      strokeLinejoin="round"
    />
    <Path d="M21 4V10H27" stroke="#B91C1C" strokeWidth={2} strokeLinejoin="round" />
    <Path d="M13 14H23" stroke="#B91C1C" strokeWidth={2} strokeLinecap="round" />
    <Path d="M13 18H23" stroke="#B91C1C" strokeWidth={2} strokeLinecap="round" />
    <Path
      d="M24 20L26 22L19 29L16 29L16 26L23 19"
      fill="#B91C1C"
      stroke="#B91C1C"
      strokeWidth={1.2}
      strokeLinejoin="round"
    />
    <Path d="M13 25C14.5 25 15 24 16 25" stroke="#B91C1C" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

// 6. More SVG (2x2 grid of 4 rounded squares)
const MoreGridIcon = () => (
  <Svg width={38} height={38} viewBox="0 0 36 36" fill="none">
    <Rect x={7} y={7} width={9} height={9} rx={3} stroke="#B91C1C" strokeWidth={2.4} />
    <Rect x={20} y={7} width={9} height={9} rx={3} stroke="#B91C1C" strokeWidth={2.4} />
    <Rect x={7} y={20} width={9} height={9} rx={3} stroke="#B91C1C" strokeWidth={2.4} />
    <Rect x={20} y={20} width={9} height={9} rx={3} stroke="#B91C1C" strokeWidth={2.4} />
  </Svg>
);

export const HomeScreen = () => {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();

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

  const displayName = meProfile?.name || user?.name || 'Sam';
  const firstName = displayName.split(' ')[0];
  
  const locationText = cleanLocationName(meProfile?.cityId || user?.cityId, meProfile?.provinceId);
  
  const bloodGroup = meProfile?.bloodGroup || donorProfile?.bloodGroup || 'O+';
  const totalDonations = donorProfile?.totalDonations || 0;
  
  let lastDonatedDate = 'N/A';
  if (donorProfile?.lastDonationDate) {
    const d = new Date(donorProfile.lastDonationDate);
    lastDonatedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // Days left to save another life computation from backend
  const lastDonationRaw = donorProfile?.lastDonationDate;
  let daysLeft = 48;
  let formattedLastDonation = '25 june 2026';

  if (lastDonationRaw) {
    const lastDate = new Date(lastDonationRaw);
    if (!isNaN(lastDate.getTime())) {
      const now = new Date();
      const diffMs = now.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      // Standard 90 days whole-blood donation cycle
      const calculatedDaysLeft = 90 - diffDays;
      daysLeft = calculatedDaysLeft > 0 ? calculatedDaysLeft : 48;

      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      formattedLastDonation = `${lastDate.getDate()} ${monthNames[lastDate.getMonth()]} ${lastDate.getFullYear()}`;
    }
  }

  const badgeText = `${daysLeft} Days Left`;

  const isAvailable = donorProfile?.donorStatus === 'ACTIVE';
  const inactiveReason = donorProfile?.inactiveReason;
  const inactiveUntil = donorProfile?.inactiveUntil;
  
  let relativeText = null;
  let exactTimeText = null;
  
  if (!isAvailable && inactiveUntil) {
    const untilDate = new Date(inactiveUntil);
    const now = new Date();
    const diffMs = untilDate.getTime() - now.getTime();
    
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
      
      const timeStr = untilDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const dateStr = untilDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.iconBtn}>
            <Feather name="bell" size={20} color="#1E293B" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatar}>
            {(meProfile?.avatarAssetId || user?.avatarAssetId) ? (
              <Image 
                source={{ uri: (meProfile?.avatarAssetId || user?.avatarAssetId) }} 
                style={{ width: '100%', height: '100%', borderRadius: 999 }} 
              />
            ) : (
              <Text style={styles.avatarLetter}>{firstName.charAt(0).toUpperCase()}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => (navigation as any).toggleDrawer()} style={styles.iconBtn}>
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
              <Text style={styles.donorName}>{displayName}</Text>
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
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                   <Feather name="moon" size={14} color="#FCA5A5" />
                   <Text style={styles.inactivePremiumTitle}>Temporarily Unavailable</Text>
                 </View>
                 <TouchableOpacity onPress={() => navigation.navigate('DonorAvailability')}>
                   <Text style={styles.inactivePremiumAction}>Change</Text>
                 </TouchableOpacity>
               </View>
               
               {inactiveReason && (
                 <Text style={styles.inactivePremiumReason}>"{inactiveReason}"</Text>
               )}

               {relativeText && (
                 <View style={styles.returnTimeWrapper}>
                   <View style={styles.returnTimeItem}>
                     <Text style={styles.returnTimeLabel}>RETURNING IN</Text>
                     <Text style={styles.returnTimeValue}>{relativeText}</Text>
                   </View>
                   <View style={styles.returnTimeDivider} />
                   <View style={styles.returnTimeItem}>
                     <Text style={styles.returnTimeLabel}>EXACT TIME & DAY</Text>
                     <Text style={styles.returnTimeValue}>{exactTimeText}</Text>
                   </View>
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

        {/* DAYS LEFT TO SAVE ANOTHER LIFE BANNER */}
        <TouchableOpacity 
          style={styles.countdownBanner} 
          onPress={() => navigation.navigate('Profile', { screen: 'EligibilityStatus' })}
          activeOpacity={0.85}
        >
          <View style={styles.countdownIconBox}>
            <Ionicons name="time-outline" size={26} color="#FFFFFF" />
          </View>
          <View style={styles.countdownTextCol}>
            <Text style={styles.countdownTitle} numberOfLines={1}>
              Days left to save another life
            </Text>
            <Text style={styles.countdownSubtitle} numberOfLines={1}>
              Your last recorded donation was on {formattedLastDonation}
            </Text>
          </View>
          <View style={styles.countdownBadge}>
            <Text style={styles.countdownBadgeText}>{badgeText}</Text>
          </View>
        </TouchableOpacity>

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
            onPress={() => navigation.navigate('Donate')}
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
    paddingLeft: 16,
    paddingRight: 16, 
    paddingTop: 12, 
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 6 },
  logoBox: { width: 38, height: 38, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  logoImage: { width: '100%', height: '100%' },
  brandTitle: { fontSize: 14, fontFamily: 'Inter_900Black', color: '#0F172A', letterSpacing: -0.5 },
  nepalBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  nepalBadgeText: { fontSize: 10, fontFamily: 'Inter_900Black', color: '#DC2626', letterSpacing: 0.5 },
  brandTagline: { fontSize: 9, color: '#64748B', marginTop: 1, fontFamily: 'Inter_500Medium' },
  
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center', flexShrink: 0 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', position: 'relative', borderWidth: 1, borderColor: '#E2E8F0' },
  notificationBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  notificationBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#DC2626', overflow: 'hidden' },
  avatarLetter: { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: '#DC2626' },

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
  donorName: { fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: '#FFFFFF', marginBottom: 4, letterSpacing: -0.5 },
  donorLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  donorLocationText: { fontSize: 13, color: '#FECACA', fontFamily: 'Inter_500Medium' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#0F172A' },
  
  inactivePremiumBox: { backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  inactivePremiumHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  inactivePremiumTitle: { fontSize: 12, fontFamily: 'Inter_800ExtraBold', color: '#FCA5A5', letterSpacing: 0.5 },
  inactivePremiumAction: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#FFFFFF', textDecorationLine: 'underline' },
  inactivePremiumReason: { fontSize: 13, color: '#FFFFFF', fontStyle: 'italic', marginBottom: 16, lineHeight: 18 },
  returnTimeWrapper: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, alignItems: 'center' },
  returnTimeItem: { flex: 1 },
  returnTimeLabel: { fontSize: 9, fontFamily: 'Inter_800ExtraBold', color: '#FCA5A5', marginBottom: 2, letterSpacing: 0.5 },
  returnTimeValue: { fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: '#FFFFFF' },
  returnTimeDivider: { width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 12 },

  donorStatsBox: { flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 16, padding: 16, marginTop: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  statCol: { flex: 1 },
  statLabel: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', color: '#FECACA', letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#FFFFFF' },

  countdownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FAF2',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 24,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  countdownIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#00A86B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownTextCol: {
    flex: 1,
    marginHorizontal: 12,
    justifyContent: 'center',
  },
  countdownTitle: {
    fontSize: 13.5,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  countdownSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    lineHeight: 15,
  },
  countdownBadge: {
    backgroundColor: '#00A86B',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownBadgeText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.2,
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
    backgroundColor: '#F8FAFC',
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
