import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { DonationsAPI } from '../../api/donations.api';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';

export const DonateScreen = () => {
  const navigation = useNavigation<any>();

  const { data, isLoading } = useQuery({
    queryKey: ['my-donations'],
    queryFn: () => DonationsAPI.list().then(res => res.data.data || res.data),
  });

  const donations = Array.isArray(data) ? data : data?.items || [];

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <PrimaryButton title="Record New Donation" onPress={() => navigation.navigate('RecordDonation')} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : donations.length === 0 ? (
        <Text style={styles.emptyState}>You haven't recorded any donations yet. Start tracking your life-saving journey!</Text>
      ) : (
        <FlatList
          data={donations}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.hospital}>{item.hospitalName || item.location}</Text>
                <Text style={styles.status}>{item.status}</Text>
              </View>
              <Text style={styles.date}>Donated on: {new Date(item.donationDate).toLocaleDateString()}</Text>
              <Text style={styles.details}>{item.units} Unit(s) • {item.donationType}</Text>
            </View>
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
  actions: {
    padding: spacing.l,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listContainer: {
    padding: spacing.l,
  },
  emptyState: {
    ...typography.body1,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.l,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  hospital: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text,
  },
  status: {
    ...typography.caption,
    color: colors.primaryDark,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  date: {
    ...typography.body2,
    color: colors.textMuted,
    marginBottom: 2,
  },
  details: {
    ...typography.body2,
    color: colors.text,
  }
});
