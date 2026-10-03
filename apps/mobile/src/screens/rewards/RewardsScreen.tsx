import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RewardsAPI } from '../../api/rewards.api';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { colors, spacing } from '../../theme';

interface MilestoneRule {
  badgeType: string;
  count: number;
  name: string;
}

export const RewardsScreen = () => {
  const navigation = useNavigation<any>();

  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
    isRefetching,
  } = useQuery({
    queryKey: ['donor-rewards-stats'],
    queryFn: () => RewardsAPI.getStats().then((res) => res.data?.data || res.data),
  });

  const { data: milestonesData, isLoading: isLoadingMilestones } = useQuery({
    queryKey: ['reward-milestones'],
    queryFn: () => RewardsAPI.getMilestones().then((res) => res.data?.data || res.data),
  });

  const milestones: MilestoneRule[] = Array.isArray(milestonesData)
    ? milestonesData
    : [
        { badgeType: 'FIRST_SAVER', count: 1, name: 'First Saver' },
        { badgeType: 'REGULAR_SAVER', count: 3, name: 'Regular Saver' },
        { badgeType: 'BLOOD_HERO', count: 5, name: 'Blood Hero' },
        { badgeType: 'ACTIVE_LIFE_SAVER', count: 10, name: 'Active Life Saver' },
        { badgeType: 'COMMUNITY_CHAMPION', count: 25, name: 'Community Champion' },
      ];

  const earnedBadges: any[] = stats?.earnedBadges || [];
  const earnedTypes = new Set(earnedBadges.map((b: any) => b.badgeType));
  const totalDonations = stats?.totalDonations || 0;
  const livesSaved = stats?.livesSaved || totalDonations * 3;

  // Next milestone calculation
  const nextMilestone = milestones.find((m) => m.count > totalDonations);
  const prevCount = 0;
  const progressPercent = nextMilestone
    ? Math.min(100, Math.round((totalDonations / nextMilestone.count) * 100))
    : 100;

  const getBadgeIcon = (type: string) => {
    switch (type) {
      case 'FIRST_SAVER':
        return 'water';
      case 'REGULAR_SAVER':
        return 'shield-checkmark';
      case 'BLOOD_HERO':
        return 'trophy';
      case 'ACTIVE_LIFE_SAVER':
        return 'flame';
      case 'COMMUNITY_CHAMPION':
        return 'ribbon';
      default:
        return 'medal';
    }
  };

  const isLoading = isLoadingStats || isLoadingMilestones;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.badgePill}>
          <Ionicons name="trophy" size={13} color="#D97706" />
          <Text style={styles.badgePillText}>DONOR RECOGNITION</Text>
        </View>
        <Text style={styles.headerTitle}>Hero Badges & Milestones</Text>
        <Text style={styles.headerSub}>
          Celebrating life-saving milestones and voluntary donations across Nepal.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetchStats}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <View style={{ gap: 14 }}>
            <SkeletonCard height={150} />
            <SkeletonCard height={100} />
            <SkeletonCard height={200} />
          </View>
        ) : (
          <>
            {/* Impact Hero Card */}
            <View style={styles.impactCard}>
              <View style={styles.impactCardHeader}>
                <View>
                  <Text style={styles.donorLevelTitle}>
                    {earnedBadges.length > 0
                      ? earnedBadges[earnedBadges.length - 1]?.badgeType?.replace(/_/g, ' ')
                      : 'Aspiring Lifesaver'}
                  </Text>
                  <Text style={styles.donorLevelSub}>Voluntary Blood Donor</Text>
                </View>
                <View style={styles.heroTrophyCircle}>
                  <Ionicons name="trophy" size={24} color="#D97706" />
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statVal}>{totalDonations}</Text>
                  <Text style={styles.statLabel}>Verified Donations</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statCol}>
                  <Text style={[styles.statVal, { color: '#15803D' }]}>~{livesSaved}</Text>
                  <Text style={styles.statLabel}>Lives Saved</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statCol}>
                  <Text style={[styles.statVal, { color: '#B91C1C' }]}>{earnedBadges.length}</Text>
                  <Text style={styles.statLabel}>Badges Earned</Text>
                </View>
              </View>

              {/* Next Milestone Progress Bar */}
              {nextMilestone ? (
                <View style={styles.progressContainer}>
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.nextMilestoneText}>
                      Next: <Text style={{ fontFamily: 'Inter_700Bold' }}>{nextMilestone.name}</Text>
                    </Text>
                    <Text style={styles.progressCountText}>
                      {totalDonations} / {nextMilestone.count} donations ({progressPercent}%)
                    </Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                  </View>
                </View>
              ) : (
                <View style={styles.championBanner}>
                  <Ionicons name="ribbon" size={16} color="#15803D" />
                  <Text style={styles.championBannerText}>
                    Community Champion: Highest milestone achieved!
                  </Text>
                </View>
              )}
            </View>

            {/* Badges Section */}
            <Text style={styles.sectionTitle}>Milestone Badges</Text>
            <View style={styles.badgesList}>
              {milestones.map((m) => {
                const isUnlocked = earnedTypes.has(m.badgeType);
                const earnedItem = earnedBadges.find((b: any) => b.badgeType === m.badgeType);
                const iconName = getBadgeIcon(m.badgeType);

                return (
                  <View
                    key={m.badgeType}
                    style={[styles.badgeCard, isUnlocked && styles.badgeCardUnlocked]}
                  >
                    <View
                      style={[
                        styles.badgeIconCircle,
                        isUnlocked && styles.badgeIconCircleUnlocked,
                      ]}
                    >
                      <Ionicons
                        name={iconName as any}
                        size={22}
                        color={isUnlocked ? '#B91C1C' : '#94A3B8'}
                      />
                    </View>

                    <View style={styles.badgeInfo}>
                      <View style={styles.badgeTitleRow}>
                        <Text style={[styles.badgeName, isUnlocked && styles.badgeNameUnlocked]}>
                          {m.name}
                        </Text>
                        {isUnlocked ? (
                          <View style={styles.unlockedPill}>
                            <Ionicons name="checkmark-circle" size={12} color="#15803D" />
                            <Text style={styles.unlockedPillText}>Unlocked</Text>
                          </View>
                        ) : (
                          <View style={styles.lockedPill}>
                            <Ionicons name="lock-closed" size={11} color="#64748B" />
                            <Text style={styles.lockedPillText}>
                              {m.count - totalDonations} more needed
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.badgeDesc}>
                        Requirement: {m.count} verified blood donation
                        {m.count > 1 ? 's' : ''}
                      </Text>

                      {isUnlocked && earnedItem?.createdAt && (
                        <Text style={styles.earnedDateText}>
                          Earned on{' '}
                          {new Date(earnedItem.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* View Certificates CTA */}
            <TouchableOpacity
              style={styles.certificatesCta}
              onPress={() => navigation.navigate('Certificates')}
              activeOpacity={0.88}
            >
              <View style={styles.certificatesCtaLeft}>
                <Ionicons name="document-text" size={24} color={colors.primary} />
                <View>
                  <Text style={styles.certificatesCtaTitle}>Official Certificates</Text>
                  <Text style={styles.certificatesCtaSub}>
                    View and download verifiable donation certificates
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* Ethical Recognition Disclaimer */}
            <View style={styles.disclaimerBox}>
              <Ionicons name="information-circle-outline" size={16} color="#64748B" />
              <Text style={styles.disclaimerText}>
                Blood Sanjal recognizes donors for voluntary altruism. In accordance with National
                Blood Transfusion Guidelines, rewards are non-monetary recognitions and carry no
                financial value.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
    marginBottom: 6,
  },
  badgePillText: {
    fontSize: 10,
    fontFamily: 'Inter_800ExtraBold',
    color: '#D97706',
    letterSpacing: 0.3,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_800ExtraBold',
    color: '#0F172A',
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 36,
  },
  impactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  impactCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  donorLevelTitle: {
    fontSize: 18,
    fontFamily: 'Inter_800ExtraBold',
    color: '#0F172A',
  },
  donorLevelSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  heroTrophyCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 14,
  },
  statCol: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 20,
    fontFamily: 'Inter_800ExtraBold',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#E2E8F0',
  },
  progressContainer: {
    marginTop: 2,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nextMilestoneText: {
    fontSize: 12,
    color: '#334155',
  },
  progressCountText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'Inter_600SemiBold',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  championBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  championBannerText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#065F46',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  badgesList: {
    gap: 10,
    marginBottom: 16,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    opacity: 0.8,
  },
  badgeCardUnlocked: {
    opacity: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFFDFD',
  },
  badgeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  badgeIconCircleUnlocked: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  badgeInfo: {
    flex: 1,
  },
  badgeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  badgeName: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#64748B',
  },
  badgeNameUnlocked: {
    color: '#0F172A',
  },
  unlockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  unlockedPillText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#15803D',
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  lockedPillText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#64748B',
  },
  badgeDesc: {
    fontSize: 11,
    color: '#64748B',
  },
  earnedDateText: {
    fontSize: 10,
    color: '#059669',
    fontFamily: 'Inter_600SemiBold',
    marginTop: 2,
  },
  certificatesCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  certificatesCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  certificatesCtaTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  certificatesCtaSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
});
