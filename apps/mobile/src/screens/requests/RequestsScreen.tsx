import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BloodRequestsAPI } from '../../api/requests.api';
import { RequestCard } from '../../components/requests/RequestCard';
import { SkeletonCard, EmptyState } from '../../components/common';
import { colors, spacing } from '../../theme';

export const RequestsScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'ALL' | 'MINE' | 'EMERGENCY'>('ALL');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['blood-requests', activeTab],
    queryFn: () => {
      if (activeTab === 'MINE') {
        return BloodRequestsAPI.list({ myRequests: true }).then((res) => res.data?.data || res.data);
      } else if (activeTab === 'EMERGENCY') {
        return BloodRequestsAPI.list({ urgency: 'EMERGENCY' }).then((res) => res.data?.data || res.data);
      } else {
        return BloodRequestsAPI.list({ limit: 20 }).then((res) => res.data?.data || res.data);
      }
    },
  });

  const rawRequests: any[] = Array.isArray(data)
    ? data
    : data?.requests || data?.items || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerIconCircle}>
            <Ionicons name="medical" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Blood Requests</Text>
            <Text style={styles.headerSubtitle}>
              Live hospital patient demands and verified emergency broadcasts
            </Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateRequest')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.createButtonText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Filters */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ALL' && styles.activeTab]}
            onPress={() => setActiveTab('ALL')}
          >
            <Text style={[styles.tabText, activeTab === 'ALL' && styles.activeTabText]}>
              All Active
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'EMERGENCY' && styles.activeTabEmergency]}
            onPress={() => setActiveTab('EMERGENCY')}
          >
            <Ionicons
              name="alert-circle"
              size={14}
              color={activeTab === 'EMERGENCY' ? '#FFFFFF' : colors.danger}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'EMERGENCY' && styles.activeTabTextEmergency,
              ]}
            >
              Emergency
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'MINE' && styles.activeTab]}
            onPress={() => setActiveTab('MINE')}
          >
            <Text style={[styles.tabText, activeTab === 'MINE' && styles.activeTabText]}>
              My Requests
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Request List or Skeletons */}
      <View style={styles.listContainer}>
        {isLoading && !isRefetching ? (
          <View style={{ padding: 16 }}>
            <SkeletonCard height={140} borderRadius={16} />
            <SkeletonCard height={140} borderRadius={16} />
            <SkeletonCard height={140} borderRadius={16} />
          </View>
        ) : rawRequests.length === 0 ? (
          <EmptyState
            icon="water-outline"
            title={
              activeTab === 'EMERGENCY'
                ? 'No Urgent Emergency Broadcasts'
                : activeTab === 'MINE'
                ? 'You Have Not Created Any Requests'
                : 'No Active Blood Requests'
            }
            description={
              activeTab === 'MINE'
                ? 'If you or a loved one requires blood, create a verified request to reach donors.'
                : 'All current blood requests have been fulfilled or closed. Submit a new request if needed.'
            }
            actionTitle="Create Blood Request"
            onAction={() => navigation.navigate('CreateRequest')}
          />
        ) : (
          <FlatList
            data={rawRequests}
            keyExtractor={(item) => item._id || item.id}
            contentContainerStyle={styles.scrollList}
            showsVerticalScrollIndicator={false}
            refreshing={isRefetching}
            onRefresh={refetch}
            renderItem={({ item }) => (
              <RequestCard
                id={item._id || item.id}
                bloodGroup={item.bloodGroup}
                patientName={item.patientName || 'Patient in Need'}
                location={
                  item.hospitalName ||
                  item.hospital ||
                  item.hospitalLocation?.address ||
                  'Hospital'
                }
                unitsRequired={item.unitsRequired || item.units || 1}
                urgency={item.urgency || 'NORMAL'}
                status={item.status || 'ACTIVE'}
                details={item.additionalInfo}
                onPress={() =>
                  navigation.navigate('RequestDetail', { id: item._id || item.id })
                }
              />
            )}
          />
        )}
      </View>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 10,
  },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  activeTabEmergency: {
    backgroundColor: colors.danger,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '700',
  },
  activeTabTextEmergency: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContainer: {
    flex: 1,
  },
  scrollList: {
    padding: 16,
  },
});
