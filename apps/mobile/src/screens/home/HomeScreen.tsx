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
    queryKey: ['my-donor-profile'],
    queryFn: () => DonorsAPI.getMyProfile().then((res) => res.data?.data || res.data).catch(() => null),
  });

  // Unread Notifications Count
  const { data: notificationsData, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () =>
      NotificationsAPI.list({ isRead: false }).then((res) => res.data?.data || res.data),
  });

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
  const locationText = meProfile?.location?.city ? `${meProfile.location.city}, ${meProfile.location.province || 'Nepal'}` : 'Nepal';
  
  const bloodGroup = donorProfile?.bloodGroup || meProfile?.bloodGroup || 'O+';
  const totalDonations = donorProfile?.counters?.totalDonations || 0;
  
  let lastDonatedDate = 'N/A';
  if (donorProfile?.lastDonatedAt) {
    const d = new Date(donorProfile.lastDonatedAt);
    lastDonatedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  const isAvailable = donorProfile ? donorProfile.active : false;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER STRIP */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => (navigation as any).toggleDrawer()} style={styles.iconBtn}>
            <Feather name="menu" size={20} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.logoBox}>
            <Ionicons name="heart" size={24} color="#FFFFFF" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.brandTitle}>BLOOD SANJAL</Text>
            </View>
            <Text style={styles.brandTagline}>Connecting People. Saving Lives.</Text>
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
            <Text style={styles.avatarLetter}>{firstName.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={styles.iconBtn}>
            <Feather name="more-vertical" size={20} color="#1E293B" />
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
            Hello, <Text style={{ fontWeight: '800', color: '#0F172A' }}>{firstName}</Text> 👋 Thank you for being a lifesaver 💖
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
              <View style={styles.statusPill}>
                <View style={[styles.statusDot, { backgroundColor: isAvailable ? '#22C55E' : '#EF4444' }]} />
                <Text style={styles.statusText}>{isAvailable ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>
          </View>

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
        </LinearGradient>

        {/* ELIGIBILITY CHECK CARD */}
        <View style={styles.eligibilityCard}>
          <View style={styles.eligibilityIconBox}>
            <Feather name="clock" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.eligibilityTextCol}>
            <Text style={styles.eligibilityTitle}>Donation Eligibility Check</Text>
            <Text style={styles.eligibilitySub}>
              {donorProfile?.lastDonatedAt 
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7FA' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 12, 
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
  brandTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  nepalBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  nepalBadgeText: { fontSize: 10, fontWeight: '900', color: '#DC2626', letterSpacing: 0.5 },
  brandTagline: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' },
  
  headerActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', position: 'relative', borderWidth: 1, borderColor: '#E2E8F0' },
  notificationBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  notificationBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#DC2626' },
  avatarLetter: { fontSize: 16, fontWeight: '800', color: '#DC2626' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 },

  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greetingText: { fontSize: 13, color: '#475569', flex: 1, paddingRight: 10, lineHeight: 18 },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', maxWidth: 140 },
  locationText: { fontSize: 11, fontWeight: '600', color: '#64748B', flexShrink: 1 },

  donorCard: { borderRadius: 24, padding: 24, marginBottom: 24, shadowColor: '#991B1B', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  donorCardTop: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  bloodGroupSquare: { width: 68, height: 68, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  bloodGroupText: { fontSize: 32, fontWeight: '900', color: '#DC2626' },
  donorCardInfo: { flex: 1, justifyContent: 'center' },
  donorName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 4, letterSpacing: -0.5 },
  donorLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  donorLocationText: { fontSize: 13, color: '#FECACA', fontWeight: '500' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },

  donorStatsBox: { flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 16, padding: 16, marginTop: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  statCol: { flex: 1 },
  statLabel: { fontSize: 11, fontWeight: '800', color: '#FECACA', letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },

  eligibilityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: 20, padding: 16, marginBottom: 32, borderWidth: 1, borderColor: '#D1FAE5' },
  eligibilityIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  eligibilityTextCol: { flex: 1, paddingRight: 10 },
  eligibilityTitle: { fontSize: 14, fontWeight: '800', color: '#064E3B', marginBottom: 4 },
  eligibilitySub: { fontSize: 11, color: '#047857', lineHeight: 16, fontWeight: '500' },
  iDonatedBtn: { backgroundColor: '#059669', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  iDonatedBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#64748B', letterSpacing: 1, marginBottom: 16, marginLeft: 4 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  gridItem: { width: (width - 56) / 2, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  gridIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  gridTextCol: { flex: 1 },
  gridTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginBottom: 2, letterSpacing: -0.3 },
  gridSub: { fontSize: 11, color: '#64748B', lineHeight: 14, fontWeight: '500' },
});
