import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { AuthAPI } from '../../api/auth.api';
import { BloodRequestsAPI } from '../../api/requests.api';
import { CampaignsAPI } from '../../api/campaigns.api';
import { NotificationsAPI } from '../../api/notifications.api';
import { ActionCard } from '../../components/common/ActionCard';
import { RequestCard } from '../../components/requests/RequestCard';
import { CampaignCard } from '../../components/campaigns/CampaignCard';
import { colors, spacing, typography } from '../../theme';

export const HomeScreen = () => {
  const { user, logout } = useAuthStore();
  const navigation = useNavigation<any>();

  // Use the actual backend /me endpoint if local user data is incomplete
  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => AuthAPI.getCurrentUser().then(res => res.data.data || res.data),
    initialData: user,
  });

  const { data: requestsData, isLoading: isLoadingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['blood-requests', 'active'],
    queryFn: () => BloodRequestsAPI.list({ status: 'ACTIVE', limit: 5 }).then(res => res.data.data || res.data),
  });

  const { data: campaignsData, isLoading: isLoadingCampaigns, refetch: refetchCampaigns } = useQuery({
    queryKey: ['campaigns', 'upcoming'],
    queryFn: () => CampaignsAPI.list({ limit: 3 }).then(res => res.data.data || res.data),
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => NotificationsAPI.list({ isRead: false }).then(res => res.data.data || res.data),
  });

  const isRefreshing = isLoadingRequests || isLoadingCampaigns;
  const onRefresh = () => {
    refetchRequests();
    refetchCampaigns();
  };

  const activeRequests = Array.isArray(requestsData) ? requestsData : requestsData?.items || [];
  const activeCampaigns = Array.isArray(campaignsData) ? campaignsData : campaignsData?.items || [];
  const unreadCount = Array.isArray(notificationsData) ? notificationsData.length : notificationsData?.total || 0;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header Area */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {meData?.name?.split(' ')[0] || 'Donor'}</Text>
          <Text style={styles.locationContext}>{meData?.cityId || 'Nepal'}</Text>
        </View>
        <TouchableOpacity style={styles.bellIcon} onPress={() => navigation.navigate('Notifications')}>
          <Text style={{ fontSize: 24 }}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Hero / Action Area */}
      <View style={styles.section}>
        <ActionCard 
          title="Find Blood" 
          subtitle="Search verified donors nearby" 
          onPress={() => navigation.navigate('Find Blood')} 
        />
        <ActionCard 
          title="Request Blood" 
          subtitle="Create a normal blood request" 
          onPress={() => navigation.navigate('Requests', { screen: 'CreateRequest' })} 
        />
        <ActionCard 
          title="Emergency Request" 
          subtitle="Urgent broadcast (Requires Admin Verification)" 
          isEmergency
          onPress={() => navigation.navigate('Requests', { screen: 'EmergencyRequest' })} 
        />
        <Text style={styles.disclaimer}>
          Blood Sanjal connects people and does not diagnose or guarantee medical eligibility.
        </Text>
      </View>

      {/* Live Content: Nearby Requests */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Urgent Requests Nearby</Text>
        </View>
        
        {isLoadingRequests ? (
          <ActivityIndicator color={colors.primary} style={{ margin: 20 }} />
        ) : activeRequests.length > 0 ? (
          activeRequests.map((req: any, index: number) => (
            <RequestCard 
              key={req._id || index}
              bloodGroup={req.bloodGroup || 'A+'}
              location={req.hospitalName || 'Unknown Location'}
              urgency={req.urgency || 'NORMAL'}
              status={req.status || 'ACTIVE'}
            />
          ))
        ) : (
          <Text style={styles.emptyState}>No urgent requests right now.</Text>
        )}
      </View>

      {/* Live Content: Campaigns */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Upcoming Blood Camps</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Campaigns')}>
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>View All</Text>
          </TouchableOpacity>
        </View>
        {isLoadingCampaigns ? (
          <ActivityIndicator color={colors.primary} style={{ margin: 20 }} />
        ) : activeCampaigns.length > 0 ? (
          activeCampaigns.map((camp: any, index: number) => (
            <TouchableOpacity key={camp._id || index} onPress={() => navigation.navigate('CampaignDetails', { id: camp._id })}>
              <CampaignCard 
                title={camp.title || 'Blood Donation Drive'}
                organizer={camp.organizer || 'Red Cross Society'}
                date={camp.startDate ? new Date(camp.startDate).toLocaleDateString() : 'TBD'}
                location={camp.location?.address || 'Unknown'}
              />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyState}>No upcoming camps found.</Text>
        )}
      </View>

      <View style={[styles.section, { paddingBottom: 40 }]}>
         <TouchableOpacity onPress={logout} style={{ padding: 15, alignItems: 'center' }}>
           <Text style={{ color: colors.danger, fontWeight: 'bold' }}>Log Out</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.l,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greeting: {
    ...typography.h2,
    color: colors.primaryDark,
  },
  locationContext: {
    ...typography.body2,
    color: colors.textMuted,
    marginTop: 2,
  },
  bellIcon: {
    padding: spacing.xs,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  section: {
    padding: spacing.l,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.s,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.m,
  },
  emptyState: {
    ...typography.body2,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: spacing.m,
  }
});
