import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Dimensions, Alert, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { AdminAPI } from '../../api/admin.api';
import { colors, spacing, typography, fonts } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { PieChart, BarChart, LineChart, ProgressChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export const AdminDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to exit the Executive Panel?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const { data: stats, isLoading, refetch, isRefetching, isError, error } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      try {
        const res = await AdminAPI.getDashboardStats();
        console.log('[Admin Dashboard] Raw API Response:', JSON.stringify(res.data));
        const finalData = res.data?.data?.data || res.data?.data || res.data;
        console.log('[Admin Dashboard] Extracted Stats:', JSON.stringify(finalData));
        return finalData;
      } catch (err: any) {
        console.error('[Admin Dashboard] API Error:', err?.response?.data || err);
        throw err;
      }
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.danger} />
        <Text style={styles.loadingText}>Loading Intelligence...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="warning" size={48} color={colors.danger} />
        <Text style={styles.loadingText}>Failed to load executive data.</Text>
        <Text style={[styles.loadingText, { fontSize: 12, color: colors.textMuted }]}>
          {(error as any)?.response?.data?.error?.message || 'Please check your connection or permissions.'}
        </Text>
        <TouchableOpacity style={{ marginTop: 20, padding: 10, backgroundColor: colors.danger, borderRadius: 8 }} onPress={() => refetch()}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statBoxes = [
    { label: 'Total Users', value: stats?.users ?? 0, sub: `${stats?.activeUsers ?? 0} active`, color: colors.primary, icon: 'people', route: 'AdminUsers' },
    { label: 'Donors', value: stats?.activeDonors ?? 0, sub: `${stats?.donors ?? 0} total`, color: colors.navyDark, icon: 'water', route: 'AdminUsers' },
    { label: 'Requests', value: stats?.activeRequests ?? 0, sub: `${stats?.requests ?? 0} total`, color: '#D97706', icon: 'document-text', route: 'AdminRequests' },
    { 
      label: 'Emergencies', 
      value: stats?.pendingEmergencies ?? 0, 
      sub: (stats?.pendingEmergencies ?? 0) > 0 ? 'Action required!' : 'None pending',
      isCritical: (stats?.pendingEmergencies ?? 0) > 0,
      color: colors.danger,
      icon: 'warning',
      route: 'EmergencyReview'
    },
    { label: 'Donations', value: stats?.donations ?? 0, sub: 'Verified logs', color: '#059669', icon: 'medkit', route: 'AdminDonations' },
    { label: 'Campaigns', value: stats?.campaigns ?? 0, sub: 'Active drives', color: '#7C3AED', icon: 'calendar', route: 'AdminCampaigns' },
  ];

  const adminMenuGroups = [
    {
      groupTitle: 'Clinical & Triage Operations',
      items: [
        {
          title: 'Emergency Broadcast',
          subtitle: 'Verify clinical urgency and push broadcasts',
          route: 'EmergencyReview',
          badge: (stats?.pendingEmergencies ?? 0) > 0 ? `${stats?.pendingEmergencies} PENDING` : null,
          badgeColor: colors.danger,
          icon: 'alert-circle',
          iconColor: colors.danger,
          iconBg: '#FEE2E2',
        },
        {
          title: 'Blood Requests',
          subtitle: 'Verify admissions, track donor fulfillment',
          route: 'AdminRequests',
          icon: 'water',
          iconColor: '#D97706',
          iconBg: '#FEF3C7',
        },
        {
          title: 'Donation Verifications',
          subtitle: 'Validate blood bank proofs & issue certs',
          route: 'AdminDonations',
          icon: 'medkit',
          iconColor: '#059669',
          iconBg: '#D1FAE5',
        },
      ],
    },
    {
      groupTitle: 'Community & Communications',
      items: [
        {
          title: 'Users & Donors',
          subtitle: 'Audit KYC, approve availability, suspend accounts',
          route: 'AdminUsers',
          icon: 'people',
          iconColor: colors.primary,
          iconBg: '#DBEAFE',
        },
        {
          title: 'Campaigns & Drives',
          subtitle: 'Schedule blood camps and track RSVPs',
          route: 'AdminCampaigns',
          icon: 'calendar',
          iconColor: '#7C3AED',
          iconBg: '#EDE9FE',
        },
        {
          title: 'Targeted Broadcasts',
          subtitle: 'Send filtered notifications by blood group',
          route: 'AdminBroadcast',
          icon: 'megaphone',
          iconColor: '#EA580C',
          iconBg: '#FFEDD5',
        },
      ],
    },
    {
      groupTitle: 'Governance & Finance',
      items: [
        {
          title: 'Revenue Ledger',
          subtitle: `Platform Payments - Rs. ${(stats?.revenueNPR ?? 0).toLocaleString()}`,
          route: 'AdminPayments',
          icon: 'cash',
          iconColor: '#0D9488',
          iconBg: '#CCFBF1',
        },
        {
          title: 'System Settings',
          subtitle: 'Configure platform fees and reminder rules',
          route: 'AdminSettings',
          icon: 'settings',
          iconColor: '#475569',
          iconBg: '#F1F5F9',
        },
        {
          title: 'Security Audit Logs',
          subtitle: 'Timeline of every administrative mutation',
          route: 'AdminAudit',
          icon: 'shield-checkmark',
          iconColor: '#2563EB',
          iconBg: '#DBEAFE',
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.surface} />}
      >
        <LinearGradient
          colors={[colors.danger, '#991B1B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerProfile}>
              <View style={styles.logoContainer}>
                <Image source={require('../../../assets/icon.png')} style={styles.headerLogo} resizeMode="contain" />
              </View>
              <Text style={styles.headerGreeting}>Super Admin</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.backButton}>
              <Ionicons name="log-out-outline" size={28} color={colors.surface} />
            </TouchableOpacity>
          </View>
          <Text style={styles.bannerTitle}>Executive Ops</Text>
          <Text style={styles.bannerSubtitle}>Authoritative oversight for blood supply, verification, and live safety networks.</Text>
          
          <View style={styles.revenueCard}>
            <View>
              <Text style={styles.revenueLabel}>Total Platform Revenue</Text>
              <Text style={styles.revenueValue}>Rs. {(stats?.revenueNPR ?? 0).toLocaleString()}</Text>
            </View>
            <View style={styles.revenueIconBg}>
              <Ionicons name="wallet" size={24} color={colors.danger} />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.mainContent}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            {statBoxes.map((stat, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={[styles.statBox, stat.isCritical && styles.criticalBox]}
                activeOpacity={0.7}
                onPress={() => stat.route && navigation.navigate(stat.route)}
              >
                <View style={[styles.statIconContainer, { backgroundColor: stat.isCritical ? '#FECACA' : '#F1F5F9' }]}>
                  <Ionicons name={stat.icon as any} size={20} color={stat.isCritical ? colors.danger : stat.color} />
                </View>
                <Text style={[styles.statValue, { color: stat.isCritical ? colors.danger : stat.color }]}>
                  {stat.value}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={[styles.statSub, stat.isCritical && styles.criticalSub]}>{stat.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { marginHorizontal: 0, marginBottom: 0 }]}>Network Analytics</Text>
            <View style={styles.swipeIndicator}>
              <Text style={styles.swipeText}>Swipe</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.m, gap: spacing.m, marginBottom: spacing.xl }}>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>User Demographics</Text>
              <PieChart
                data={[
                  { name: 'Active Donors', population: stats?.activeDonors ?? 0, color: '#059669', legendFontColor: colors.text, legendFontSize: 11 },
                  { name: 'Regular Users', population: Math.max(0, (stats?.activeUsers ?? 0) - (stats?.activeDonors ?? 0)), color: colors.primary, legendFontColor: colors.text, legendFontSize: 11 },
                  { name: 'Inactive/Suspended', population: Math.max(0, (stats?.users ?? 0) - (stats?.activeUsers ?? 0)), color: '#CBD5E1', legendFontColor: colors.text, legendFontSize: 11 },
                ]}
                width={width * 0.8}
                height={160}
                chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"0"}
                center={[10, 0]}
                absolute
              />
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Platform Operations</Text>
              <PieChart
                data={[
                  { name: 'Users', population: stats?.users ?? 0, color: colors.primary, legendFontColor: colors.text, legendFontSize: 11 },
                  { name: 'Requests', population: stats?.requests ?? 0, color: '#D97706', legendFontColor: colors.text, legendFontSize: 11 },
                  { name: 'Donations', population: stats?.donations ?? 0, color: '#059669', legendFontColor: colors.text, legendFontSize: 11 },
                  { name: 'Campaigns', population: stats?.campaigns ?? 0, color: '#7C3AED', legendFontColor: colors.text, legendFontSize: 11 },
                ]}
                width={width * 0.8}
                height={160}
                chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"0"}
                center={[10, 0]}
                absolute
              />
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Operational Pipeline</Text>
              <BarChart
                data={{
                  labels: ["Total Req", "Active", "Emergency", "Donations"],
                  datasets: [{ data: [ stats?.requests ?? 0, stats?.activeRequests ?? 0, stats?.pendingEmergencies ?? 0, stats?.donations ?? 0 ] }]
                }}
                width={width * 0.85}
                height={170}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
                chartConfig={{
                  backgroundColor: colors.surface,
                  backgroundGradientFrom: colors.surface,
                  backgroundGradientTo: colors.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(185, 28, 28, ${opacity})`,
                  labelColor: (opacity = 1) => colors.textMuted,
                  barPercentage: 0.6,
                  propsForLabels: { fontFamily: fonts.medium, fontSize: 10 }
                }}
                style={{ borderRadius: 12, marginTop: 8 }}
                showValuesOnTopOfBars
              />
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Donation Growth Trend</Text>
              <LineChart
                data={{
                  labels: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
                  datasets: [
                    {
                      data: [
                        Math.round((stats?.donations ?? 10) * 0.4),
                        Math.round((stats?.donations ?? 10) * 0.55),
                        Math.round((stats?.donations ?? 10) * 0.7),
                        Math.round((stats?.donations ?? 10) * 0.6),
                        Math.round((stats?.donations ?? 10) * 0.85),
                        stats?.donations ?? 10
                      ]
                    }
                  ]
                }}
                width={width * 0.85}
                height={170}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: colors.surface,
                  backgroundGradientFrom: colors.surface,
                  backgroundGradientTo: colors.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`, // purple
                  labelColor: (opacity = 1) => colors.textMuted,
                  propsForDots: { r: "4", strokeWidth: "2", stroke: "#7C3AED" },
                  propsForLabels: { fontFamily: fonts.medium, fontSize: 10 }
                }}
                bezier
                style={{ borderRadius: 12, marginTop: 8 }}
              />
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Network Health Indexes</Text>
              <ProgressChart
                data={{
                  labels: ["Active Users", "Verified Donors", "Resolved Req"],
                  data: [
                    (stats?.users ?? 0) > 0 ? (stats!.activeUsers / stats!.users) : 0,
                    (stats?.donors ?? 0) > 0 ? (stats!.activeDonors / stats!.donors) : 0,
                    (stats?.requests ?? 0) > 0 ? ((stats!.requests - stats!.activeRequests) / stats!.requests) : 0
                  ]
                }}
                width={width * 0.8}
                height={160}
                strokeWidth={12}
                radius={24}
                chartConfig={{
                  backgroundColor: colors.surface,
                  backgroundGradientFrom: colors.surface,
                  backgroundGradientTo: colors.surface,
                  color: (opacity = 1, index) => {
                    if (index === 0) return `rgba(37, 99, 235, ${opacity})`; // primary
                    if (index === 1) return `rgba(5, 150, 105, ${opacity})`; // success
                    return `rgba(217, 119, 6, ${opacity})`; // warning/orange
                  },
                  labelColor: (opacity = 1) => colors.text,
                }}
                hideLegend={false}
                style={{ borderRadius: 12, marginTop: 8 }}
              />
            </View>
          </ScrollView>

          {adminMenuGroups.map((group, gIdx) => (
            <View key={gIdx} style={styles.menuGroup}>
              <Text style={styles.groupHeader}>{group.groupTitle}</Text>
              {group.items.map((item, iIdx) => (
                <TouchableOpacity 
                  key={iIdx} 
                  style={styles.menuItem} 
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate(item.route)}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.icon as any} size={22} color={item.iconColor} />
                  </View>
                  <View style={styles.menuItemLeft}>
                    <View style={styles.titleRow}>
                      <Text style={styles.menuItemTitle}>{item.title}</Text>
                      {item.badge && (
                        <View style={[styles.badge, { backgroundColor: item.badgeColor }]}>
                          <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.menuItemSub}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    ...typography.body2,
    fontFamily: fonts.medium,
    color: colors.textMuted,
    marginTop: spacing.m,
  },
  headerGradient: {
    paddingTop: 50,
    paddingHorizontal: spacing.l,
    paddingBottom: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  logoContainer: {
    backgroundColor: colors.surface,
    padding: 4,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLogo: {
    width: 24,
    height: 24,
  },
  headerGreeting: {
    ...typography.body2,
    fontFamily: fonts.semiBold,
    color: colors.surface,
  },
  bannerTitle: {
    ...typography.h1,
    fontFamily: fonts.bold,
    color: colors.surface,
    marginBottom: 4,
  },
  bannerSubtitle: {
    ...typography.body2,
    fontFamily: fonts.regular,
    color: '#FECACA',
    lineHeight: 20,
    maxWidth: '90%',
  },
  revenueCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.l,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    position: 'absolute',
    bottom: -30,
    left: spacing.l,
    right: spacing.l,
  },
  revenueLabel: {
    ...typography.caption,
    fontFamily: fonts.medium,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  revenueValue: {
    ...typography.h2,
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: 4,
  },
  revenueIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    marginTop: 50,
  },
  sectionTitle: {
    ...typography.h3,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  swipeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  swipeText: {
    ...typography.caption,
    color: colors.textMuted,
    fontFamily: fonts.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
    paddingHorizontal: spacing.m,
    marginBottom: spacing.xl,
    justifyContent: 'space-between',
  },
  statBox: {
    width: (width - spacing.m * 3) / 2,
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  criticalBox: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    shadowColor: colors.danger,
    shadowOpacity: 0.1,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  statValue: {
    fontSize: 24,
    fontFamily: fonts.bold,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.body2,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  statSub: {
    ...typography.caption,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  criticalSub: {
    color: colors.danger,
    fontFamily: fonts.semiBold,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTitle: {
    ...typography.body2,
    fontFamily: fonts.semiBold,
    color: colors.text,
    alignSelf: 'flex-start',
    marginBottom: spacing.s,
    paddingLeft: spacing.xs,
  },
  menuGroup: {
    paddingHorizontal: spacing.m,
    marginBottom: spacing.l,
  },
  groupHeader: {
    ...typography.caption,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.m,
    marginLeft: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 16,
    marginBottom: spacing.s,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  menuItemLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    flexWrap: 'wrap',
  },
  menuItemTitle: {
    ...typography.body1,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  menuItemSub: {
    ...typography.caption,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  footerSpace: {
    height: 20,
  },
});
