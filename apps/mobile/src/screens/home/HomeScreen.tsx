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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { AuthAPI } from '../../api/auth.api';
import { NotificationsAPI } from '../../api/notifications.api';
import { DonorsAPI } from '../../api/donors.api';
import { BloodRequestsAPI } from '../../api/requests.api';
import { RequestCard } from '../../components/requests/RequestCard';
import { colors } from '../../theme';

const { width } = Dimensions.get('window');

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

  const displayName = meProfile?.name || user?.name || 'Friend';
  const firstName = displayName.split(' ')[0];
  
  let locationText = 'Nepal';
  if (meProfile?.cityId && meProfile?.provinceId) {
    locationText = `${meProfile.cityId}, ${meProfile.provinceId}`;
  } else if (meProfile?.cityId) {
    locationText = meProfile.cityId;
  }
  
  const bloodGroup = meProfile?.bloodGroup || donorProfile?.bloodGroup || 'O+';
  const totalDonations = donorProfile?.totalDonations || 0;
  
  let lastDonatedDate = 'N/A';
  if (donorProfile?.lastDonationDate) {
    const d = new Date(donorProfile.lastDonationDate);
    lastDonatedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

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
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatar}>
            <Text style={styles.avatarLetter}>{firstName.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
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
          <View style={styles.locationPill}>
            <Feather name="map-pin" size={12} color="#DC2626" />
            <Text style={styles.locationText} numberOfLines={1}>{locationText}</Text>
          </View>
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
              <View style={styles.donorLocationRow}>
                <Feather name="map-pin" size={12} color="#FCA5A5" />
                <Text style={styles.donorLocationText}>{locationText}</Text>
              </View>
              <View>
                <TouchableOpacity 
                  style={styles.statusPill}
                  onPress={() => navigation.navigate('Profile', { screen: 'DonorAvailability' })}
                >
                  <View style={[styles.statusDot, { backgroundColor: isAvailable ? '#22C55E' : '#EF4444' }]} />
                  <Text style={styles.statusText}>{isAvailable ? 'Active' : 'Inactive'}</Text>
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
                 <TouchableOpacity onPress={() => navigation.navigate('Profile', { screen: 'DonorAvailability' })}>
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
                <Text style={styles.statValue}>{totalDonations} Times</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>LAST DONATED</Text>
                <Text style={styles.statValue}>{lastDonatedDate}</Text>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* ELIGIBILITY CHECK CARD */}
        <View style={styles.eligibilityCard}>
          <View style={styles.eligibilityIconBox}>
            <Feather name="clock" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.eligibilityTextCol}>
            <Text style={styles.eligibilityTitle}>Donation Eligibility Check</Text>
            <Text style={styles.eligibilitySub}>
              {donorProfile?.lastDonationDate 
                ? 'Check your donation readiness based on your last recorded donation!' 
                : 'Log your first donation to keep track of your eligibility!'}
            </Text>
          </View>
          <TouchableOpacity style={styles.iDonatedBtn}>
            <Text style={styles.iDonatedBtnText}>I Donated</Text>
          </TouchableOpacity>
        </View>

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.gridContainer}>
          {/* Action 1 */}
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('FindBlood')}>
            <View style={[styles.gridIconBox, { backgroundColor: '#FEE2E2' }]}>
              <Feather name="search" size={20} color="#DC2626" />
            </View>
            <View style={styles.gridTextCol}>
              <Text style={styles.gridTitle}>Find Blood</Text>
              <Text style={styles.gridSub}>Search donors near you</Text>
            </View>
          </TouchableOpacity>

          {/* Action 2 */}
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('CreateRequest')}>
            <View style={[styles.gridIconBox, { backgroundColor: '#DBEAFE' }]}>
              <Feather name="plus-circle" size={20} color="#2563EB" />
            </View>
            <View style={styles.gridTextCol}>
              <Text style={styles.gridTitle}>Request Blood</Text>
              <Text style={styles.gridSub}>Post a patient request</Text>
            </View>
          </TouchableOpacity>

          {/* Action 3 */}
          <TouchableOpacity style={styles.gridItem}>
            <View style={[styles.gridIconBox, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="water" size={20} color="#059669" />
            </View>
            <View style={styles.gridTextCol}>
              <Text style={styles.gridTitle}>I Donated Blood</Text>
              <Text style={styles.gridSub}>Log donation & history</Text>
            </View>
          </TouchableOpacity>

          {/* Action 4 */}
          <TouchableOpacity style={styles.gridItem}>
            <View style={[styles.gridIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Feather name="calendar" size={20} color="#D97706" />
            </View>
            <View style={styles.gridTextCol}>
              <Text style={styles.gridTitle}>Blood Camps</Text>
              <Text style={styles.gridSub}>View upcoming drives</Text>
            </View>
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
              location={item.hospitalName || item.hospitalLocation?.address || 'Hospital'}
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
    paddingRight: 24, 
    paddingTop: 12, 
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: 6 },
  logoBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
  brandTitle: { fontSize: 14, fontFamily: 'Inter_900Black', color: '#0F172A', letterSpacing: -0.5 },
  nepalBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  nepalBadgeText: { fontSize: 10, fontFamily: 'Inter_900Black', color: '#DC2626', letterSpacing: 0.5 },
  brandTagline: { fontSize: 9, color: '#64748B', marginTop: 0, fontFamily: 'Inter_500Medium' },
  
  headerActions: { flexDirection: 'row', gap: 16, alignItems: 'center', flexShrink: 0 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', position: 'relative', borderWidth: 1, borderColor: '#E2E8F0' },
  notificationBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  notificationBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#DC2626' },
  avatarLetter: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#DC2626' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 },

  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greetingText: { fontSize: 13, color: '#475569', flex: 1, paddingRight: 10, lineHeight: 18, fontFamily: 'Inter_500Medium' },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', maxWidth: 140 },
  locationText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#64748B', flexShrink: 1 },

  donorCard: { borderRadius: 24, padding: 24, marginBottom: 24, shadowColor: '#991B1B', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  donorCardTop: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  bloodGroupSquare: { width: 68, height: 68, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  bloodGroupText: { fontSize: 32, fontFamily: 'Inter_900Black', color: '#DC2626' },
  donorCardInfo: { flex: 1, justifyContent: 'center' },
  donorName: { fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: '#FFFFFF', marginBottom: 4, letterSpacing: -0.5 },
  donorLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  donorLocationText: { fontSize: 13, color: '#FECACA', fontFamily: 'Inter_500Medium' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
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

  eligibilityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: 20, padding: 14, marginBottom: 32, borderWidth: 1, borderColor: '#D1FAE5' },
  eligibilityIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  eligibilityTextCol: { flex: 1, paddingRight: 8 },
  eligibilityTitle: { fontSize: 13, fontFamily: 'Inter_800ExtraBold', color: '#064E3B', marginBottom: 2 },
  eligibilitySub: { fontSize: 10, color: '#047857', lineHeight: 14, fontFamily: 'Inter_500Medium' },
  iDonatedBtn: { backgroundColor: '#059669', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  iDonatedBtnText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Inter_800ExtraBold' },

  sectionTitle: { fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: '#64748B', letterSpacing: 1, marginBottom: 16, marginLeft: 4 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  gridItem: { width: (width - 56) / 2, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  gridIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  gridTextCol: { flex: 1 },
  gridTitle: { fontSize: 13, fontFamily: 'Inter_800ExtraBold', color: '#0F172A', marginBottom: 2, letterSpacing: -0.3 },
  gridSub: { fontSize: 11, color: '#64748B', lineHeight: 14, fontFamily: 'Inter_500Medium' },

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
  campInfoText: { fontSize: 12, color: '#475569', lineHeight: 18 },
  campBloodTitle: { fontSize: 9, fontFamily: 'Inter_800ExtraBold', color: '#64748B', letterSpacing: 0.5, marginTop: 12, marginBottom: 8 },
  campBloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  campBloodTinyPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  campBloodTinyText: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', color: '#DC2626' },
  campFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  campFooterText: { flex: 1, fontSize: 10, color: '#94A3B8', paddingRight: 10 },
  campActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#A7F3D0' },
  campActionText: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', color: '#059669' },

  inviteBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginTop: 24 },
  inviteTitle: { fontSize: 14, fontFamily: 'Inter_900Black', color: '#FFFFFF', marginBottom: 4 },
  inviteSub: { fontSize: 11, color: '#FECACA', lineHeight: 16 },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  inviteBtnText: { fontSize: 12, fontFamily: 'Inter_800ExtraBold', color: '#DC2626' },
  
  noticeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#FECACA' },
  noticeTitle: { fontSize: 12, fontFamily: 'Inter_800ExtraBold', color: '#991B1B', marginBottom: 2 },
  noticeSub: { fontSize: 10, color: '#B91C1C', lineHeight: 14 },
});
