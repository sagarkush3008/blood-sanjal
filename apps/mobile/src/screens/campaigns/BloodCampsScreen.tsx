import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  StatusBar,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { getApiBaseUrl } from '../../api/client';
import { fonts } from '../../theme';

interface CampItem {
  id: string;
  name: string;
  location: string;
  date: string;
  start_time: string;
  end_time: string;
  organizer?: string;
}

export const BloodCampsScreen = ({ navigation }: any) => {
  const [camps, setCamps] = useState<CampItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchCamps = async () => {
    setIsError(false);
    try {
      // Dynamic base URL connecting directly to backend
      const rawBase = getApiBaseUrl();
      const base = rawBase.replace(/\/api\/v1$/, '');
      const response = await axios.get(`${base}/api/camps`, { timeout: 10000 });

      if (response.data && response.data.success) {
        setCamps(response.data.data || []);
      } else {
        setIsError(true);
      }
    } catch (error) {
      console.error('[BloodCampsScreen] Fetch error:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCamps();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCamps();
  };

  const handleGetDirections = (location: string, campName: string) => {
    const query = encodeURIComponent(`${campName}, ${location}`);
    const mapsUrl = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });

    if (mapsUrl) {
      Linking.canOpenURL(mapsUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(mapsUrl);
          } else {
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
          }
        })
        .catch(() => {
          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
        });
    }
  };

  const renderCampCard = ({ item }: { item: CampItem }) => (
    <View style={styles.card}>
      {/* Camp Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.campName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.organizer ? (
            <Text style={styles.organizerText} numberOfLines={1}>
              Organized by {item.organizer}
            </Text>
          ) : null}
        </View>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusPillText}>Open Drive</Text>
        </View>
      </View>

      {/* Details Row: Date & Time */}
      <View style={styles.detailsBlock}>
        <View style={styles.detailRow}>
          <Feather name="calendar" size={15} color="#DC2626" style={styles.detailIcon} />
          <Text style={styles.detailText}>
            {item.date} • {item.start_time} - {item.end_time}
          </Text>
        </View>

        {/* Location Row */}
        <View style={styles.detailRow}>
          <Feather name="map-pin" size={15} color="#DC2626" style={styles.detailIcon} />
          <Text style={styles.detailText} numberOfLines={2}>
            {item.location}
          </Text>
        </View>
      </View>

      {/* Action: Blood-red Outline Get Directions Button */}
      <TouchableOpacity
        style={styles.directionsBtn}
        onPress={() => handleGetDirections(item.location, item.name)}
        activeOpacity={0.75}
      >
        <Ionicons name="navigate-outline" size={17} color="#DC2626" style={{ marginRight: 6 }} />
        <Text style={styles.directionsBtnText}>Get Directions</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* 1. Modern Minimal Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (navigation?.goBack ? navigation.goBack() : null)}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Blood Donation Camps</Text>
          <Text style={styles.headerSub}>Upcoming Voluntary Drives</Text>
        </View>

        <TouchableOpacity
          onPress={handleRefresh}
          style={styles.refreshBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Feather name="rotate-cw" size={18} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* 2. Body Area (Loading / Error / List) */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Finding upcoming blood camps...</Text>
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <View style={styles.errorIconCircle}>
            <Feather name="alert-circle" size={32} color="#DC2626" />
          </View>
          <Text style={styles.errorTitle}>Unable to Load Camps</Text>
          <Text style={styles.errorSub}>
            Please check your network connection and try again.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchCamps} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={camps}
          keyExtractor={(item) => item.id}
          renderItem={renderCampCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#DC2626" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name="calendar" size={30} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No Upcoming Camps Found</Text>
              <Text style={styles.emptySub}>
                There are currently no donation drives scheduled. Please check back later.
              </Text>
            </View>
          }
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitleBox: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#64748B',
    marginTop: 2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    paddingRight: 10,
  },
  campName: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#1E1E1E',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  organizerText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#64748B',
    marginTop: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusPillText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: '#059669',
  },
  detailsBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 10,
  },
  detailText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#64748B',
    flex: 1,
    lineHeight: 18,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  directionsBtnText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: '#DC2626',
    letterSpacing: 0.1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#64748B',
    marginTop: 14,
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: '#0F172A',
    marginBottom: 6,
  },
  errorSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryBtnText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
