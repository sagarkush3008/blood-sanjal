import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { BloodRequestsAPI } from '../../api/requests.api';
import { RequestCard } from '../../components/requests/RequestCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';

export const RequestsScreen = () => {
  const navigation = useNavigation<any>();

  // Fetch only my requests (backend should filter this if we pass a specific param, or we assume `/blood-requests/me` exists, but for now we use list)
  const { data, isLoading } = useQuery({
    queryKey: ['my-requests'],
    queryFn: () => BloodRequestsAPI.list({ myRequests: true }).then(res => res.data.data || res.data),
  });

  const requests = Array.isArray(data) ? data : data?.items || [];

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <View style={{ flex: 1, marginRight: spacing.s }}>
          <PrimaryButton title="New Request" onPress={() => navigation.navigate('CreateRequest')} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.s }}>
          <TouchableOpacity 
            style={[styles.emergencyButton]} 
            onPress={() => navigation.navigate('EmergencyRequest')}
          >
            <Text style={styles.emergencyButtonText}>Emergency</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : requests.length === 0 ? (
        <Text style={styles.emptyState}>You have not created any blood requests yet.</Text>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <RequestCard
              bloodGroup={item.bloodGroup}
              location={item.hospitalName}
              urgency={item.urgency}
              status={item.status}
            />
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
    flexDirection: 'row',
    padding: spacing.l,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  emergencyButton: {
    backgroundColor: colors.danger,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emergencyButtonText: {
    color: colors.surface,
    ...typography.button,
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
  }
});
