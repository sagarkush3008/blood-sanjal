import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { CampaignsAPI } from '../../api/campaigns.api';
import { CampaignCard } from '../../components/campaigns/CampaignCard';
import { colors, spacing, typography } from '../../theme';

export const CampaignsScreen = () => {
  const navigation = useNavigation<any>();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['campaigns-list'],
    queryFn: () => CampaignsAPI.list().then(res => res.data.data || res.data),
  });

  const campaigns = Array.isArray(data) ? data : data?.items || [];

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : campaigns.length === 0 ? (
        <Text style={styles.emptyState}>No upcoming blood donation campaigns found.</Text>
      ) : (
        <FlatList
          data={campaigns}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshing={isLoading}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('CampaignDetails', { id: item._id })}>
              <View style={styles.cardWrapper}>
                <CampaignCard
                  title={item.title}
                  organizer={item.organizer}
                  date={new Date(item.startDate).toLocaleDateString()}
                  location={item.location?.address || 'See details'}
                />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    padding: spacing.m,
  },
  cardWrapper: {
    marginBottom: spacing.m,
  },
  emptyState: {
    ...typography.body1,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  }
});
