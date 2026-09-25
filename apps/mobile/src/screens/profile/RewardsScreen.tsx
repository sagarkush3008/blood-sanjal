import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { RewardsAPI, CertificatesAPI } from '../../api/rewards.api';
import { colors, spacing, typography } from '../../theme';

export const RewardsScreen = () => {
  const navigation = useNavigation<any>();
  const { data: rewardsData, isLoading: rewardsLoading } = useQuery({
    queryKey: ['my-rewards'],
    queryFn: () => RewardsAPI.getMyRewards().then(res => res.data.data || res.data),
  });

  const { data: certData, isLoading: certLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => CertificatesAPI.getMyCertificates().then(res => res.data.data || res.data),
  });

  if (rewardsLoading || certLoading) {
    return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />;
  }

  const badges = rewardsData?.badges || [];
  const certs = Array.isArray(certData) ? certData : certData?.items || [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.pointsCard}>
        <Text style={styles.pointsValue}>{rewardsData?.points || 0}</Text>
        <Text style={styles.pointsLabel}>Total Hero Points</Text>
      </View>

      <Text style={styles.sectionTitle}>Earned Badges</Text>
      {badges.length === 0 ? (
        <Text style={styles.emptyText}>You haven't earned any badges yet. Donate blood to unlock achievements!</Text>
      ) : (
        <View style={styles.badgeGrid}>
          {badges.map((badge: any, idx: number) => (
            <View key={idx} style={styles.badgeItem}>
              <View style={styles.badgeIconPlaceholder}>
                <Text>🏅</Text>
              </View>
              <Text style={styles.badgeName}>{badge.name}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Certificates of Appreciation</Text>
        <TouchableOpacity onPress={() => navigation.navigate('VerifyCertificate')}>
          <Text style={{ color: colors.primary, fontWeight: 'bold', marginTop: spacing.xl }}>Verify</Text>
        </TouchableOpacity>
      </View>
      {certs.length === 0 ? (
        <Text style={styles.emptyText}>No certificates available yet.</Text>
      ) : (
        certs.map((cert: any, idx: number) => (
          <View key={idx} style={styles.certCard}>
            <Text style={styles.certTitle}>Blood Donation Certificate</Text>
            <Text style={styles.certDate}>Issued: {new Date(cert.issuedAt).toLocaleDateString()}</Text>
            <Text style={styles.certCode}>Verification Code: {cert.certificateCode}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.l,
  },
  pointsCard: {
    backgroundColor: colors.primary,
    padding: spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  pointsValue: {
    ...typography.h1,
    color: colors.surface,
    fontSize: 48,
  },
  pointsLabel: {
    ...typography.body1,
    color: colors.surface,
    opacity: 0.9,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.m,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body2,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
  },
  badgeItem: {
    width: '30%',
    alignItems: 'center',
  },
  badgeIconPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  badgeName: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.text,
  },
  certCard: {
    backgroundColor: colors.surface,
    padding: spacing.l,
    borderRadius: 12,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  certTitle: {
    ...typography.body1,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 4,
  },
  certDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 8,
  },
  certCode: {
    ...typography.caption,
    fontFamily: 'monospace',
    color: colors.text,
    backgroundColor: colors.background,
    padding: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  }
});
