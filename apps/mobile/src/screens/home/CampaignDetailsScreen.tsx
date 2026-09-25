import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from '@react-navigation/native';
import { CampaignsAPI } from '../../api/campaigns.api';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';

export const CampaignDetailsScreen = () => {
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const { id } = route.params;

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => CampaignsAPI.getById(id).then(res => res.data.data || res.data),
  });

  const participateMutation = useMutation({
    mutationFn: () => CampaignsAPI.participate(id),
    onSuccess: () => {
      Alert.alert("Success!", "You have registered to participate in this campaign.");
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    },
    onError: (err: any) => {
      Alert.alert("Notice", err.response?.data?.message || "Failed to register.");
    }
  });

  if (isLoading) {
    return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />;
  }

  if (!campaign) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Campaign not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerImagePlaceholder}>
        <Text style={{ fontSize: 40 }}>🎪</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{campaign.title}</Text>
        <Text style={styles.organizer}>By: {campaign.organizer}</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>📅 {new Date(campaign.startDate).toLocaleString()}</Text>
          <Text style={styles.infoText}>📍 {campaign.location?.address || 'Location TBA'}</Text>
          <Text style={styles.infoText}>👥 {campaign.participants?.length || 0} participants so far</Text>
        </View>
        
        <Text style={styles.descriptionLabel}>Description:</Text>
        <Text style={styles.description}>{campaign.description || 'Join us to save lives!'}</Text>
        
        <View style={styles.spacer} />

        <PrimaryButton 
          title="Participate Now" 
          onPress={() => participateMutation.mutate()} 
          loading={participateMutation.isPending}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerImagePlaceholder: {
    height: 200,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.l,
  },
  title: {
    ...typography.h1,
    color: colors.primaryDark,
    marginBottom: 4,
  },
  organizer: {
    ...typography.body1,
    color: colors.textMuted,
    fontWeight: 'bold',
    marginBottom: spacing.l,
  },
  infoBox: {
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.l,
  },
  infoText: {
    ...typography.body2,
    color: colors.text,
    marginVertical: 4,
  },
  descriptionLabel: {
    ...typography.body1,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body2,
    color: colors.textMuted,
    lineHeight: 24,
  },
  errorText: {
    ...typography.body1,
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  spacer: {
    height: spacing.xl,
  }
});
