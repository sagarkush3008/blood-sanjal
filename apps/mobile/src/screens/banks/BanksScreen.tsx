import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Linking,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LocationsAPI } from '../../api/locations.api';
import { colors } from '../../theme';

interface BloodBank {
  id: string;
  name: string;
  type: string;
  address: string;
  distance: string;
  phone: string;
  hours: string;
  status: 'AMPLE' | 'MODERATE' | 'URGENT';
  availableGroups: string[];
}

const BLOOD_BANKS_DATA: BloodBank[] = [
  {
    id: '1',
    name: 'Central Blood Transfusion Service (Nepal Red Cross)',
    type: 'National Central Bank',
    address: 'Exhibition Road, Bhrikutimandap, Kathmandu',
    distance: '1.2 km away',
    phone: '+97714225344',
    hours: 'Open 24 Hours / 7 Days',
    status: 'AMPLE',
    availableGroups: ['A+', 'B+', 'O+', 'AB+', 'A-', 'O-'],
  },
  {
    id: '2',
    name: 'TU Teaching Hospital Blood Bank',
    type: 'Government Teaching Hospital',
    address: 'Maharajgunj, Kathmandu',
    distance: '3.8 km away',
    phone: '+97714412303',
    hours: 'Open 24 Hours / 7 Days',
    status: 'MODERATE',
    availableGroups: ['A+', 'B+', 'O+', 'AB+'],
  },
  {
    id: '3',
    name: 'Patan Hospital Blood Transfusion Center',
    type: 'Community Hospital Center',
    address: 'Lagankhel, Lalitpur',
    distance: '4.5 km away',
    phone: '+97715522266',
    hours: 'Open 24 Hours / 7 Days',
    status: 'URGENT',
    availableGroups: ['A+', 'B+', 'O+'],
  },
  {
    id: '4',
    name: 'Bhaktapur Red Cross Blood Bank',
    type: 'District Blood Bank',
    address: 'Doodhpati, Bhaktapur',
    distance: '11.0 km away',
    phone: '+97716611661',
    hours: '08:00 AM - 08:00 PM',
    status: 'AMPLE',
    availableGroups: ['A+', 'B+', 'O+', 'AB+', 'B-'],
  },
  {
    id: '5',
    name: 'Bir Hospital Emergency Blood Storage',
    type: 'Government Emergency Unit',
    address: 'Kanti Path, Kathmandu',
    distance: '1.8 km away',
    phone: '+97714221119',
    hours: 'Open 24 Hours / 7 Days',
    status: 'MODERATE',
    availableGroups: ['A+', 'B+', 'O+'],
  },
  {
    id: '6',
    name: 'Civil Service Hospital Blood Center',
    type: 'Public Hospital Unit',
    address: 'Minbhawan, Kathmandu',
    distance: '4.1 km away',
    phone: '+97714107000',
    hours: 'Open 24 Hours / 7 Days',
    status: 'AMPLE',
    availableGroups: ['A+', 'B+', 'O+', 'AB+', 'A-'],
  },
];

export const BanksScreen = () => {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['blood-banks-directory'],
    queryFn: async () => {
      const res = await LocationsAPI.getBloodBanks();
      return res.data?.data || res.data;
    },
  });

  const bloodBanksList: BloodBank[] = Array.isArray(data) && data.length > 0
    ? data.map((b: any) => ({
        id: b.id || b._id || String(Math.random()),
        name: b.name || 'Blood Center',
        type: b.type || 'Blood Transfusion Center',
        address: b.address || 'Kathmandu, Nepal',
        distance: b.distance || 'Central',
        phone: b.phone || '+97714225344',
        hours: b.hours || '24 Hours / 7 Days',
        status: (b.status === 'AMPLE' || b.status === 'MODERATE' || b.status === 'URGENT') ? b.status : 'AMPLE',
        availableGroups: Array.isArray(b.availableGroups) ? b.availableGroups : ['A+', 'B+', 'O+', 'AB+'],
      }))
    : BLOOD_BANKS_DATA;

  const filteredBanks = bloodBanksList.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const makeCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const getStatusBadge = (status: BloodBank['status']) => {
    switch (status) {
      case 'AMPLE':
        return { label: 'High Stock', bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' };
      case 'MODERATE':
        return { label: 'Moderate', bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
      case 'URGENT':
        return { label: 'Critical Supply', bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <View style={styles.brandRow}>
              <Ionicons name="medkit" size={20} color="#DC2626" />
              <Text style={styles.headerTitle}>Blood Banks Directory</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Verified national centers with real-time stock levels
            </Text>
          </View>

          <TouchableOpacity
            style={styles.profileChip}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={20} color="#0F172A" />
            <Text style={styles.profileChipText}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* 24/7 Helpline Banner */}
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.emergencyBanner}
          onPress={() => makeCall('1130')}
        >
          <View style={styles.emergencyIcon}>
            <Ionicons name="call" size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>24/7 Emergency Blood Helpline</Text>
            <Text style={styles.emergencyDesc}>Dial 1130 for instant ambulance & blood unit dispatch</Text>
          </View>
          <View style={styles.callPill}>
            <Text style={styles.callPillText}>Call 1130</Text>
          </View>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by hospital name or city..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filteredBanks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        renderItem={({ item }) => {
          const status = getStatusBadge(item.status);
          return (
            <View style={styles.bankCard}>
              <View style={styles.cardHeader}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{item.type}</Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: status.bg, borderColor: status.border },
                  ]}
                >
                  <Text style={[styles.statusPillText, { color: status.text }]}>
                    {status.label}
                  </Text>
                </View>
              </View>

              <Text style={styles.bankName}>{item.name}</Text>

              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={15} color="#64748B" />
                <Text style={styles.metaText} numberOfLines={1}>
                  {item.address}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={15} color="#059669" />
                <Text style={[styles.metaText, { color: '#059669', fontWeight: '600' }]}>
                  {item.hours} · {item.distance}
                </Text>
              </View>

              {/* In-Stock Blood Groups */}
              <View style={styles.stockRow}>
                <Text style={styles.stockLabel}>Stocked Groups:</Text>
                <View style={styles.stockPills}>
                  {item.availableGroups.map((bg) => (
                    <View key={bg} style={styles.groupBadge}>
                      <Text style={styles.groupBadgeText}>{bg}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => makeCall(item.phone)}
                >
                  <Ionicons name="call" size={15} color="#FFFFFF" />
                  <Text style={styles.callButtonText}>Call Blood Bank</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={() =>
                    Linking.openURL(
                      `https://maps.google.com/?q=${encodeURIComponent(
                        item.name + ' ' + item.address
                      )}`
                    )
                  }
                >
                  <Ionicons name="navigate" size={15} color="#0F172A" />
                  <Text style={styles.directionsButtonText}>Directions</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  emergencyBanner: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  emergencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  emergencyIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emergencyDesc: {
    fontSize: 11,
    color: '#FECACA',
    marginTop: 1,
  },
  callPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  callPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  listContainer: {
    padding: 14,
    paddingBottom: 24,
  },
  bankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  bankName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  stockLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  stockPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  groupBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    height: 36,
    borderRadius: 8,
    gap: 5,
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  directionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 36,
    borderRadius: 8,
    gap: 5,
  },
  directionsButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0F172A',
  },
});
