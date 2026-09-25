import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { AdminAPI } from '../../api/admin.api';
import { colors, spacing, typography } from '../../theme';

export const AdminDashboardScreen = () => {
  const navigation = useNavigation<any>();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => AdminAPI.getDashboardStats().then(res => res.data.data || res.data),
  });

  if (isLoading) {
    return <ActivityIndicator size="large" color={colors.danger} style={{ marginTop: spacing.xl }} />;
  }

  const statBoxes = [
    { label: 'Total Users', value: stats?.users || 0 },
    { label: 'Active Requests', value: stats?.activeRequests || 0 },
    { label: 'Pending Emergencies', value: stats?.pendingEmergencies || 0, isCritical: true },
    { label: 'Donations', value: stats?.donations || 0 },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Platform Overview</Text>
      
      <View style={styles.statsGrid}>
        {statBoxes.map((stat, idx) => (
          <View key={idx} style={[styles.statBox, stat.isCritical && styles.criticalBox]}>
            <Text style={[styles.statValue, stat.isCritical && styles.criticalText]}>{stat.value}</Text>
            <Text style={[styles.statLabel, stat.isCritical && styles.criticalText]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Management Areas</Text>

      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EmergencyReview')}>
        <Text style={[styles.menuItemText, { color: colors.danger, fontWeight: 'bold' }]}>🚨 Review Emergency Broadcasts</Text>
        <Text style={styles.menuItemArrow}>→</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AdminUsers')}>
        <Text style={styles.menuItemText}>👥 Manage Users & Donors</Text>
        <Text style={styles.menuItemArrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AdminDonations')}>
        <Text style={styles.menuItemText}>🩸 Verify Donations</Text>
        <Text style={styles.menuItemArrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AdminSettings')}>
        <Text style={styles.menuItemText}>📊 System Settings & Fees</Text>
        <Text style={styles.menuItemArrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AdminAudit')}>
        <Text style={styles.menuItemText}>🛡️ Audit Logs</Text>
        <Text style={styles.menuItemArrow}>→</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.m,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginVertical: spacing.m,
    paddingHorizontal: spacing.s,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
  },
  statBox: {
    width: '47%',
    backgroundColor: colors.surface,
    padding: spacing.l,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  criticalBox: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2',
  },
  statValue: {
    ...typography.h2,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  criticalText: {
    color: colors.danger,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.l,
    borderRadius: 12,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItemText: {
    ...typography.body1,
    color: colors.text,
  },
  menuItemArrow: {
    color: colors.textMuted,
    fontSize: 18,
  }
});
