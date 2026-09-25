import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CampaignsAPI } from '../../api/campaigns.api';
import { CampaignCard } from '../../components/campaigns/CampaignCard';

export const CampaignsScreen = () => {
  const navigation = useNavigation<any>();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['campaigns-list'],
    queryFn: () => CampaignsAPI.list().then((res) => res.data.data || res.data),
  });

  const campaigns = Array.isArray(data) ? data : data?.items || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Upcoming Blood Drives</Text>
          <Text style={styles.headerSubtitle}>
            Volunteer and donate blood in community donation camps
          </Text>
        </View>
        <View style={styles.badge}>
          <Ionicons name="calendar" size={16} color="#DC2626" />
          <Text style={styles.badgeCount}>{campaigns.length} Camps</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Loading donation camps...</Text>
        </View>
      ) : campaigns.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="calendar-outline" size={36} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>No Camps Scheduled</Text>
          <Text style={styles.emptyText}>
            Check back soon for new community blood drives and donation events in your area.
          </Text>
        </View>
      ) : (
        <FlatList
          data={campaigns}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor="#DC2626"
            />
          }
          renderItem={({ item }) => (
            <CampaignCard
              title={item.title}
              organizer={item.organizer || 'BloodLink Partner'}
              date={item.startDate}
              location={item.location?.address || 'Community Center, Kathmandu'}
              participantsCount={item.participants?.length || 18}
              onPress={() =>
                navigation.navigate('CampaignDetails', { id: item._id })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  badgeCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});

