import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { BloodGroupChip, PrimaryButton } from '../../components/common';
import { PaymentBottomSheet } from '../../components/payments/PaymentBottomSheet';
import { colors, fonts } from '../../theme';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const DISTANCES = [5, 10, 25, 50];

export const FindBloodScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();

  const initialGroup = route.params?.bloodGroup || route.params?.preselectedBloodGroup || 'O+';

  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>(initialGroup);
  const [selectedDistance, setSelectedDistance] = useState<number>(10);

  // Paywall & Payment Modal State
  const [hasPaidFee, setHasPaidFee] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

  const openPaymentModal = () => {
    setIsPaymentModalOpen(true);
  };

  // Intercept Search Action
  const handleSearch = () => {
    if (!hasPaidFee) {
      openPaymentModal();
    } else {
      // Seamlessly route to DonorListScreen
      navigation.navigate('DonorList', {
        selectedGroup: selectedBloodGroup,
        distance: selectedDistance,
      });
    }
  };

  // Success Routing
  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    setHasPaidFee(true);

    // Invalidate cache so target screen fetches fresh donors
    queryClient.invalidateQueries({ queryKey: ['donors', 'list', selectedBloodGroup] });

    // Route user seamlessly to DonorListScreen
    navigation.navigate('DonorList', {
      selectedGroup: selectedBloodGroup,
      distance: selectedDistance,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* 1. Header (Clean App Bar with Settings Gear in Top Right) */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="search" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Find Blood Donors</Text>
            <Text style={styles.headerSubtitle}>
              Locate verified, consent-gated donors across Nepal
            </Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Profile', { screen: 'Settings' })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <Ionicons name="settings-outline" size={20} color="#475569" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Refined Selectors Section */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Select Blood Group</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {BLOOD_GROUPS.map((bg) => (
              <BloodGroupChip
                key={bg}
                bloodGroup={bg}
                selected={selectedBloodGroup === bg}
                onPress={(group) => setSelectedBloodGroup(group)}
                style={styles.chip}
              />
            ))}
          </ScrollView>

          <View style={styles.distanceRow}>
            <Text style={styles.distanceLabel}>Distance Radius:</Text>
            <View style={styles.distancePills}>
              {DISTANCES.map((dist) => {
                const isSelected = selectedDistance === dist;
                return (
                  <TouchableOpacity
                    key={dist}
                    style={[
                      styles.distancePill,
                      isSelected && styles.distancePillActive,
                    ]}
                    onPress={() => setSelectedDistance(dist)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.distancePillText,
                        isSelected && styles.distancePillTextActive,
                      ]}
                    >
                      {dist} km
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Primary Action Button */}
          <PrimaryButton
            title="Search Donors"
            icon="search-outline"
            onPress={handleSearch}
            style={styles.searchButton}
          />
        </View>

        {/* 3. Borderless Trust Card (Seamless & Breathable) */}
        <View style={styles.trustCard}>
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={19} color="#16A34A" style={styles.trustIcon} />
            <View style={styles.trustTextCol}>
              <Text style={styles.trustTitle}>Verified Donors Only</Text>
              <Text style={styles.trustSub}>Every donor profile is verified with confirmed blood group records.</Text>
            </View>
          </View>

          <View style={styles.trustItem}>
            <Ionicons name="lock-closed" size={18} color="#3B82F6" style={styles.trustIcon} />
            <View style={styles.trustTextCol}>
              <Text style={styles.trustTitle}>Privacy-First Consent</Text>
              <Text style={styles.trustSub}>Direct contact numbers are revealed only after explicit donor approval.</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Premium Payment Bottom Sheet Modal */}
      <PaymentBottomSheet
        visible={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        selectedBloodGroup={selectedBloodGroup}
        amount="NPR 15.00"
      />
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#64748B',
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterLabel: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: '#374151',
    marginBottom: 12,
  },
  chipsRow: {
    gap: 8,
    paddingBottom: 8,
  },
  chip: {
    marginRight: 0,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 20,
  },
  distanceLabel: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: '#475569',
  },
  distancePills: {
    flexDirection: 'row',
    gap: 6,
  },
  distancePill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF', // Pure white background for inactive
    borderWidth: 1,
    borderColor: '#E5E7EB', // Very faint 1px gray border
    alignItems: 'center',
    justifyContent: 'center',
  },
  distancePillActive: {
    backgroundColor: '#FEF2F2', // Solid, soft red background
    borderWidth: 0, // Absolutely zero borders
    borderColor: 'transparent',
  },
  distancePillText: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    color: '#475569', // Dark gray text
  },
  distancePillTextActive: {
    color: '#DC2626', // Pure bold Red text
    fontFamily: fonts.bold,
  },
  searchButton: {
    marginTop: 6,
    borderRadius: 14,
  },
  // 3. Borderless Trust Card
  trustCard: {
    backgroundColor: '#F8FAFC', // Full-width ultra-light gray background blending seamlessly into screen
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 16,
    borderWidth: 0, // Completely remove card's outer outline/border
    gap: 16, // Breathable 16px margin between list items
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  trustIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  trustTextCol: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: '#0F172A',
    marginBottom: 2,
  },
  trustSub: {
    fontSize: 12.5,
    fontFamily: fonts.regular,
    color: '#64748B',
    lineHeight: 18,
  },
});
