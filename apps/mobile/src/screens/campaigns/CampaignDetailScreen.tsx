import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { CampaignsAPI } from '../../api/campaigns.api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BloodGroupChip } from '../../components/common/BloodGroupChip';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { colors, spacing } from '../../theme';

export const CampaignDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const campaignId = route.params?.id;

  const [confirmCancelDialog, setConfirmCancelDialog] = useState(false);

  // Fetch Campaign Details
  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => CampaignsAPI.getById(campaignId).then((res) => res.data?.data || res.data),
    enabled: !!campaignId,
  });

  // Fetch User's Registered Campaigns to check registration state
  const { data: myData } = useQuery({
    queryKey: ['my-campaigns'],
    queryFn: () => CampaignsAPI.listMy().then((res) => res.data?.data || res.data),
  });

  const myCampaigns: any[] = Array.isArray(myData)
    ? myData
    : myData?.items || myData?.results || (Array.isArray(myData?.data) ? myData.data : []);

  const isRegistered = myCampaigns.some(
    (c) => c._id === campaignId || c.campaignId?._id === campaignId
  );

  // RSVP Mutation
  const rsvpMutation = useMutation({
    mutationFn: () => CampaignsAPI.participate(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
      Alert.alert(
        'RSVP Confirmed! 🩸',
        'You have successfully registered for this blood drive. Thank you for your commitment to saving lives!'
      );
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        err.response?.data?.error?.message || err.response?.data?.message || 'Failed to RSVP.'
      );
    },
  });

  // Withdraw Mutation
  const withdrawMutation = useMutation({
    mutationFn: () => CampaignsAPI.withdraw(campaignId),
    onSuccess: () => {
      setConfirmCancelDialog(false);
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
      Alert.alert('RSVP Withdrawn', 'Your registration has been cancelled.');
    },
    onError: (err: any) => {
      Alert.alert(
        'Error',
        err.response?.data?.error?.message || err.response?.data?.message || 'Failed to cancel RSVP.'
      );
    },
  });

  // Share Campaign
  const handleShare = async () => {
    if (!campaign) return;
    const formattedDate = new Date(campaign.date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    try {
      await Share.share({
        message: `🩸 Join us at "${campaign.title}"!\nOrganized by: ${campaign.organizer}\nDate: ${formattedDate} (${campaign.startTime} - ${campaign.endTime})\nVenue: ${campaign.location}\nJoin via Blood Sanjal to save lives together!`,
      });
    } catch {}
  };

  if (isLoading || !campaign) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ padding: 16, gap: 14 }}>
          <SkeletonCard height={180} />
          <SkeletonCard height={80} />
          <SkeletonCard height={120} />
        </View>
      </SafeAreaView>
    );
  }

  const campaignDate = new Date(campaign.date);
  const formattedDate = campaignDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          Campaign Details
        </Text>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Ionicons name="share-social-outline" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Section */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerPlaceholder}>
            <Ionicons name="heart-circle" size={48} color={colors.primary} />
            <Text style={styles.bannerTagline}>COMMUNITY BLOOD DRIVE</Text>
          </View>
          <View style={styles.statusPill}>
            <StatusBadge status={campaign.status || 'PUBLISHED'} />
          </View>
        </View>

        {/* Campaign Info Card */}
        <View style={styles.card}>
          <Text style={styles.title}>{campaign.title}</Text>
          <View style={styles.organizerRow}>
            <Ionicons name="business" size={14} color="#64748B" />
            <Text style={styles.organizerText}>Organized by {campaign.organizer}</Text>
          </View>

          <View style={styles.divider} />

          {/* Date & Time */}
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date & Time</Text>
              <Text style={styles.infoValue}>{formattedDate}</Text>
              <Text style={styles.infoSub}>
                {campaign.startTime} - {campaign.endTime} (NPT)
              </Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Venue Location</Text>
              <Text style={styles.infoValue}>{campaign.location}</Text>
            </View>
          </View>

          {/* Needed Blood Groups */}
          {campaign.bloodGroupsNeeded && campaign.bloodGroupsNeeded.length > 0 && (
            <View style={styles.neededSection}>
              <Text style={styles.sectionLabel}>Blood Groups Urgently Needed</Text>
              <View style={styles.chipsRow}>
                {campaign.bloodGroupsNeeded.map((bg: string) => (
                  <BloodGroupChip key={bg} bloodGroup={bg} />
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={styles.sectionLabel}>About This Blood Drive</Text>
            <Text style={styles.descText}>
              {campaign.description ||
                'Join our community blood donation drive. Blood donation takes less than an hour and saves up to three lives in emergency wards.'}
            </Text>
          </View>

          {/* Donor Guidelines */}
          <View style={styles.guidelinesBox}>
            <View style={styles.guidelinesHeader}>
              <Ionicons name="information-circle" size={16} color="#0D9488" />
              <Text style={styles.guidelinesTitle}>Donor Preparation Tips</Text>
            </View>
            <Text style={styles.guidelinesItem}>• Drink plenty of water and eat a healthy meal prior to donation.</Text>
            <Text style={styles.guidelinesItem}>• Bring official photo ID (Citizenship, License, or Student ID).</Text>
            <Text style={styles.guidelinesItem}>• Avoid alcohol consumption 24 hours beforehand.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom RSVP Bar */}
      <View style={styles.bottomBar}>
        {isRegistered ? (
          <View style={styles.registeredBar}>
            <View style={styles.registeredStatusRow}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={styles.registeredBarText}>You're RSVP'd to Donate</Text>
            </View>
            <TouchableOpacity
              style={styles.cancelRsvpBtn}
              onPress={() => setConfirmCancelDialog(true)}
              disabled={withdrawMutation.isPending}
            >
              <Text style={styles.cancelRsvpText}>Cancel RSVP</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <PrimaryButton
            title="RSVP to Donate Blood"
            icon="add-circle"
            onPress={() => rsvpMutation.mutate()}
            loading={rsvpMutation.isPending}
          />
        )}
      </View>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        visible={confirmCancelDialog}
        title="Withdraw RSVP?"
        message="Are you sure you want to cancel your donation RSVP for this drive? Organizers rely on attendee numbers for equipment preparation."
        confirmText="Withdraw"
        isDestructive
        onConfirm={() => withdrawMutation.mutate()}
        onCancel={() => setConfirmCancelDialog(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 4,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  shareBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  bannerContainer: {
    height: 140,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  bannerPlaceholder: {
    alignItems: 'center',
    gap: 6,
  },
  bannerTagline: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  statusPill: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 25,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  organizerText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  infoSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  neededSection: {
    marginTop: 6,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  descSection: {
    marginBottom: 16,
  },
  descText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  guidelinesBox: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  guidelinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  guidelinesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  guidelinesItem: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  registeredBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  registeredStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  registeredBarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  cancelRsvpBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelRsvpText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
});
