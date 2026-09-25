import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CampaignsAPI } from '../../api/campaigns.api';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing } from '../../theme';

export const CampaignDetailsScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { id } = route.params;

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () =>
      CampaignsAPI.getById(id).then((res) => res.data.data || res.data),
  });

  const participateMutation = useMutation({
    mutationFn: () => CampaignsAPI.participate(id),
    onSuccess: () => {
      Alert.alert(
        'Registered Successfully! 🎉',
        'Thank you for volunteering! You are confirmed for this donation camp. Please bring a valid photo ID.'
      );
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    },
    onError: (err: any) => {
      Alert.alert(
        'Notice',
        err.response?.data?.message || 'Could not complete registration.'
      );
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingArea}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading campaign details...</Text>
      </SafeAreaView>
    );
  }

  if (!campaign) {
    return (
      <SafeAreaView style={styles.loadingArea}>
        <Text style={styles.errorText}>Campaign not found.</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const startDate = new Date(campaign.startDate);
  const formattedDate = !isNaN(startDate.getTime())
    ? startDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Upcoming Event';

  const formattedTime = !isNaN(startDate.getTime())
    ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '09:00 AM - 04:00 PM';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#B91C1C" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={styles.bannerHeader}>
          <TouchableOpacity
            style={styles.navBackBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.bannerIconCircle}>
            <Ionicons name="medical" size={40} color="#DC2626" />
          </View>
          <View style={styles.liveTag}>
            <View style={styles.liveDot} />
            <Text style={styles.liveTagText}>OFFICIAL BLOOD DRIVE</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Title & Organizer Card */}
          <View style={styles.card}>
            <Text style={styles.title}>{campaign.title}</Text>
            <View style={styles.organizerRow}>
              <Ionicons name="shield-checkmark" size={16} color="#059669" />
              <Text style={styles.organizerText}>
                Organized by {campaign.organizer || 'Red Cross Society'}
              </Text>
            </View>
          </View>

          {/* Quick Info Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Ionicons name="calendar-outline" size={20} color="#DC2626" />
              <Text style={styles.statLabel}>Date</Text>
              <Text style={styles.statValue} numberOfLines={2}>
                {formattedDate}
              </Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="time-outline" size={20} color="#2563EB" />
              <Text style={styles.statLabel}>Time</Text>
              <Text style={styles.statValue}>{formattedTime}</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="location-outline" size={20} color="#059669" />
              <Text style={styles.statLabel}>Venue</Text>
              <Text style={styles.statValue} numberOfLines={2}>
                {campaign.location?.address || 'Community Center, Ward 4'}
              </Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="people-outline" size={20} color="#D97706" />
              <Text style={styles.statLabel}>Volunteers</Text>
              <Text style={styles.statValue}>
                {campaign.participants?.length || 24} Registered
              </Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>About This Blood Drive</Text>
            <Text style={styles.description}>
              {campaign.description ||
                'Join our community blood donation drive. Blood collected is distributed directly to hospital intensive care units and blood banks to save emergency patients and trauma victims.'}
            </Text>
          </View>

          {/* Donor Guidelines */}
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>Donor Checklist</Text>
            <View style={styles.checkItem}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={styles.checkText}>Age 18 - 65 and weight above 45kg</Text>
            </View>
            <View style={styles.checkItem}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={styles.checkText}>Stay well hydrated and eat a light meal</Text>
            </View>
            <View style={styles.checkItem}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={styles.checkText}>Bring a valid government or student photo ID</Text>
            </View>
          </View>

          {/* Action Button */}
          <View style={{ marginTop: 12 }}>
            <PrimaryButton
              title="Register as Donor for this Camp"
              icon="heart"
              onPress={() => participateMutation.mutate()}
              loading={participateMutation.isPending}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '700',
  },
  backBtn: {
    marginTop: 12,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  backBtnText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  bannerHeader: {
    height: 180,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  navBackBtn: {
    position: 'absolute',
    top: 14,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  content: {
    padding: 16,
    marginTop: -20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  organizerText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 6,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  description: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  checkText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
});

