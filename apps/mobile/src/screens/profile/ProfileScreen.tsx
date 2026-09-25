import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { AuthAPI } from '../../api/auth.api';
import { RewardsAPI } from '../../api/rewards.api';
import { colors, spacing, typography } from '../../theme';

export const ProfileScreen = () => {
  const { logout } = useAuthStore();
  const navigation = useNavigation<any>();

  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => AuthAPI.getCurrentUser().then(res => res.data.data || res.data),
  });

  const { data: rewardsData, isLoading: rewardsLoading } = useQuery({
    queryKey: ['my-rewards'],
    queryFn: () => RewardsAPI.getMyRewards().then(res => res.data.data || res.data),
  });

  if (meLoading) {
    return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />;
  }

  const points = rewardsData?.points || 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{meData?.name?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.name}>{meData?.name}</Text>
        <Text style={styles.email}>{meData?.email}</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{points} Hero Points</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.menuItemText}>Edit Profile</Text>
          <Text style={styles.menuItemArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PrivacySettings')}>
          <Text style={styles.menuItemText}>Privacy & Visibility</Text>
          <Text style={styles.menuItemArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ContactRequests')}>
          <Text style={styles.menuItemText}>Contact Requests</Text>
          <Text style={styles.menuItemArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Rewards')}>
          <Text style={styles.menuItemText}>Achievements & Badges</Text>
          <Text style={styles.menuItemArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SupportPlatform')}>
          <Text style={styles.menuItemText}>Support Blood Sanjal</Text>
          <Text style={styles.menuItemArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { marginTop: spacing.xl }]}>
        {(meData?.role === 'ADMIN' || meData?.role === 'SUPER_ADMIN') && (
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: '#FEF2F2', borderColor: colors.danger }]} onPress={() => navigation.navigate('Admin')}>
            <Text style={[styles.menuItemText, { color: colors.danger, fontWeight: 'bold' }]}>🚨 Admin Control Panel</Text>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.m,
  },
  avatarText: {
    color: colors.surface,
    ...typography.h1,
  },
  name: {
    ...typography.h2,
    color: colors.text,
  },
  email: {
    ...typography.body2,
    color: colors.textMuted,
    marginTop: 4,
  },
  pointsBadge: {
    marginTop: spacing.m,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.m,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pointsText: {
    ...typography.caption,
    color: '#92400E',
    fontWeight: 'bold',
  },
  section: {
    paddingTop: spacing.l,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    paddingHorizontal: spacing.l,
    marginBottom: spacing.s,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemText: {
    ...typography.body1,
    color: colors.text,
  },
  menuItemArrow: {
    color: colors.textMuted,
    fontSize: 18,
  },
  logoutButton: {
    backgroundColor: colors.surface,
    padding: spacing.l,
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    ...typography.button,
    color: colors.danger,
  }
});
