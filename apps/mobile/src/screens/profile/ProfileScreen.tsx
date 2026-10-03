import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { AuthAPI } from '../../api/auth.api';
import { RewardsAPI } from '../../api/rewards.api';
import { colors } from '../../theme';

export const ProfileScreen = () => {
  const { logout, user } = useAuthStore();
  const navigation = useNavigation<any>();

  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => AuthAPI.getCurrentUser().then((res) => res.data?.data || res.data),
    initialData: user,
  });

  const { data: rewardsData } = useQuery({
    queryKey: ['my-rewards'],
    queryFn: () => RewardsAPI.getMyRewards().then((res) => res.data?.data || res.data),
  });

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const name = meData?.name || user?.name || 'Sagar Kushwaha';
  const email = meData?.email || user?.email || 'admin@bloodsanjal.org';
  const role = meData?.role || user?.role || 'DONOR';
  const points = rewardsData?.points || 150;
  const bloodGroup = meData?.bloodGroup || 'O+';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profileEmail}>{email}</Text>

          <View style={styles.badgesRow}>
            <View style={styles.roleBadge}>
              <Ionicons name="shield-checkmark" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.roleBadgeText}>{role}</Text>
            </View>

            <View style={styles.pointsBadge}>
              <Ionicons name="star" size={13} color="#D97706" style={{ marginRight: 4 }} />
              <Text style={styles.pointsBadgeText}>{points} Hero Points</Text>
            </View>
          </View>

          {/* User Quick Info Metrics */}
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Blood Group</Text>
              <Text style={styles.statValue}>{bloodGroup}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Status</Text>
              <Text style={[styles.statValue, { color: '#15803D' }]}>Verified</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Location</Text>
              <Text style={styles.statValue}>Nepal</Text>
            </View>
          </View>
        </View>

        {/* Section: Account & Privacy */}
        <Text style={styles.sectionHeading}>Account Settings</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="person-outline" size={18} color="#B91C1C" />
            </View>
            <Text style={styles.menuItemTitle}>Edit Profile Information</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('DonorAvailability')}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time-outline" size={18} color="#D97706" />
            </View>
            <Text style={styles.menuItemTitle}>Active Status & Availability</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('PrivacySettings')}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#CCFBF1' }]}>
              <Ionicons name="lock-closed-outline" size={18} color="#0D9488" />
            </View>
            <Text style={styles.menuItemTitle}>Privacy & Donor Visibility</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('ContactRequests')}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="chatbubbles-outline" size={18} color="#15803D" />
            </View>
            <Text style={styles.menuItemTitle}>Contact Consent Requests</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Section: Badges & Impact */}
        <Text style={styles.sectionHeading}>Impact & Certificates</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Certificates')}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="ribbon-outline" size={18} color="#D97706" />
            </View>
            <Text style={styles.menuItemTitle}>My Life Saver Certificates</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Rewards')}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="gift-outline" size={18} color="#B91C1C" />
            </View>
            <Text style={styles.menuItemTitle}>Rewards & Milestone Badges</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Settings')}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="settings-outline" size={18} color="#475569" />
            </View>
            <Text style={styles.menuItemTitle}>App Settings & Preferences</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Section: Admin Portal (Gated by Admin Role) */}
        {['ADMIN', 'SUPER_ADMIN'].includes(role) && (
          <>
            <Text style={[styles.sectionHeading, { color: '#DC2626' }]}>Administrative Operations</Text>
            <View style={[styles.menuCard, { borderColor: '#FECACA' }]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('Admin')}
              >
                <View style={[styles.menuIconCircle, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="shield-half" size={18} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuItemTitle, { color: '#DC2626', fontWeight: '700' }]}>
                    Admin Control Panel
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>
                    Verify requests, manage users, audits & settings
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.appVersion}>Blood Sanjal • Official Blood Network Nepal v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarInitial: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pointsBadgeText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#F1F5F9',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginLeft: 2,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  menuItemTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 56,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: 4,
    marginBottom: 16,
  },
  logoutBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  appVersion: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 20,
  },
});
