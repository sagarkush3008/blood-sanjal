import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CertificatesAPI } from '../../api/rewards.api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { colors } from '../../theme';

export const CertificatesScreen = () => {
  const navigation = useNavigation<any>();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => CertificatesAPI.getMyCertificates().then((res) => res.data?.data || res.data),
  });

  const certificates: any[] = Array.isArray(data)
    ? data
    : data?.items || data?.results || (Array.isArray(data?.data) ? data.data : []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.badgePill}>
          <Ionicons name="ribbon" size={13} color={colors.primary} />
          <Text style={styles.badgePillText}>VERIFIED CREDENTIALS</Text>
        </View>
        <Text style={styles.title}>Official Certificates</Text>
        <Text style={styles.subtitle}>
          Digital, tamper-proof certificates verifying your life-saving blood donations in Nepal.
        </Text>
      </View>

      <FlatList
        data={certificates}
        keyExtractor={(item) => item._id || item.certificateNumber}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => {
          const issueDateStr = new Date(item.issueDate || item.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <TouchableOpacity
              style={styles.certCard}
              onPress={() => navigation.navigate('CertificateDetail', { id: item._id })}
              activeOpacity={0.88}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.certIconContainer}>
                  <Ionicons name="ribbon-outline" size={26} color={colors.primary} />
                </View>
                <View style={styles.certMainInfo}>
                  <View style={styles.certTypeRow}>
                    <Text style={styles.certType}>
                      {item.certificateType ? item.certificateType.replace(/_/g, ' ') : 'DONATION'} CERTIFICATE
                    </Text>
                    <StatusBadge status={item.status || 'ISSUED'} />
                  </View>
                  <Text style={styles.certNum}>{item.certificateNumber}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardBottomRow}>
                <View style={styles.bottomDetail}>
                  <Text style={styles.bottomLabel}>Issued On</Text>
                  <Text style={styles.bottomValue}>{issueDateStr}</Text>
                </View>

                <View style={styles.bottomDetail}>
                  <Text style={styles.bottomLabel}>Verify Code</Text>
                  <Text style={styles.verifyCode}>{item.verificationCode}</Text>
                </View>

                <View style={styles.viewBtn}>
                  <Text style={styles.viewBtnText}>View</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: 12 }}>
              <SkeletonCard height={130} />
              <SkeletonCard height={130} />
            </View>
          ) : (
            <EmptyState
              icon="ribbon-outline"
              title="No Certificates Issued Yet"
              description="Official certificates are automatically generated whenever your blood donation is verified by medical facility staff."
              actionTitle="View Donation History"
              onAction={() => navigation.navigate('DonateTab')}
            />
          )
        }
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
    marginBottom: 6,
  },
  badgePillText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_800ExtraBold',
    color: '#0F172A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  certCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  certIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  certMainInfo: {
    flex: 1,
  },
  certTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  certType: {
    fontSize: 12,
    fontFamily: 'Inter_800ExtraBold',
    color: colors.primary,
    letterSpacing: 0.4,
  },
  certNum: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomDetail: {
    gap: 2,
  },
  bottomLabel: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'Inter_500Medium',
  },
  bottomValue: {
    fontSize: 12,
    color: '#334155',
    fontFamily: 'Inter_600SemiBold',
  },
  verifyCode: {
    fontSize: 12,
    fontFamily: 'Inter_800ExtraBold',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewBtnText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
  },
});
