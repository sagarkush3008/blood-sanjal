import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { CertificatesAPI } from '../../api/rewards.api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { colors, spacing } from '../../theme';

export const CertificateDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const certificateId = route.params?.id;

  const { data: cert, isLoading } = useQuery({
    queryKey: ['certificate', certificateId],
    queryFn: () => CertificatesAPI.getById(certificateId).then((res) => res.data?.data || res.data),
    enabled: !!certificateId,
  });

  const handleShare = async () => {
    if (!cert) return;
    try {
      await Share.share({
        message: `🎖️ Verified Blood Donation Certificate\nCertificate No: ${cert.certificateNumber}\nVerification Code: ${cert.verificationCode}\nIssued by Blood Sanjal Nepal in recognition of life-saving voluntary blood donation.\nVerify at: https://bloodsanjal.org/verify/${cert.verificationCode}`,
      });
    } catch {}
  };

  if (isLoading || !cert) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ padding: 16, gap: 14 }}>
          <SkeletonCard height={240} />
          <SkeletonCard height={120} />
        </View>
      </SafeAreaView>
    );
  }

  const issueDateStr = new Date(cert.issueDate || cert.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const donorProfile = cert.donorProfileId;
  const donorName = donorProfile?.userId?.name || 'Honorable Life Saver';
  const bloodGroup = donorProfile?.bloodGroup || 'Donor';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Nav */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          Certificate View
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
        {/* Certificate Frame */}
        <View style={styles.certificateOuterFrame}>
          <View style={styles.certificateInnerFrame}>
            {/* Seal / Emblem */}
            <View style={styles.emblemContainer}>
              <View style={styles.emblemCircle}>
                <Ionicons name="shield-checkmark" size={30} color={colors.primary} />
              </View>
              <Text style={styles.authorityTitle}>BLOOD SANJAL NEPAL</Text>
              <Text style={styles.authoritySub}>NATIONAL VOLUNTARY BLOOD TRANSFUSION REGISTRY</Text>
            </View>

            <View style={styles.certDivider} />

            {/* Certificate Header */}
            <Text style={styles.certHeading}>CERTIFICATE OF APPRECIATION</Text>
            <Text style={styles.presentedText}>THIS IS PROUDLY PRESENTED TO</Text>

            {/* Recipient Name */}
            <Text style={styles.donorNameText}>{donorName}</Text>
            <View style={styles.bloodGroupPill}>
              <Text style={styles.bloodGroupPillText}>BLOOD GROUP: {bloodGroup}</Text>
            </View>

            {/* Citation */}
            <Text style={styles.citationText}>
              In grateful recognition of your voluntary blood donation, a selfless act of compassion
              that has directly supported emergency patients and saved human lives in Nepal.
            </Text>

            {/* Details Table */}
            <View style={styles.detailsGrid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>CERTIFICATE NO.</Text>
                <Text style={styles.gridValue}>{cert.certificateNumber}</Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>ISSUE DATE</Text>
                <Text style={styles.gridValue}>{issueDateStr}</Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>VERIFICATION CODE</Text>
                <Text style={[styles.gridValue, { color: colors.primary }]}>
                  {cert.verificationCode}
                </Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>STATUS</Text>
                <StatusBadge status={cert.status || 'ISSUED'} />
              </View>
            </View>

            {/* Signature & Stamp Row */}
            <View style={styles.signatureRow}>
              <View style={styles.signatureBox}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Medical Verification</Text>
                <Text style={styles.signatureTitle}>Certified Center</Text>
              </View>

              <View style={styles.verifiedStamp}>
                <Ionicons name="checkmark-done-circle" size={16} color="#059669" />
                <Text style={styles.verifiedStampText}>DIGITALLY VERIFIED</Text>
              </View>

              <View style={styles.signatureBox}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Registrar Seal</Text>
                <Text style={styles.signatureTitle}>Blood Sanjal</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Verification Link Banner */}
        <View style={styles.verifyBanner}>
          <Ionicons name="qr-code-outline" size={24} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.verifyBannerTitle}>Public Verification Code</Text>
            <Text style={styles.verifyBannerCode}>{cert.verificationCode}</Text>
            <Text style={styles.verifyBannerSub}>
              Hospitals and organizations can authenticate this credential at bloodsanjal.org/verify
            </Text>
          </View>
        </View>

        {/* Share Action Button */}
        <TouchableOpacity
          style={styles.shareActionBtn}
          onPress={handleShare}
          activeOpacity={0.88}
        >
          <Ionicons name="share-social" size={18} color="#FFFFFF" />
          <Text style={styles.shareActionBtnText}>Share Official Certificate</Text>
        </TouchableOpacity>
      </ScrollView>
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
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
    flex: 1,
    textAlign: 'center',
  },
  shareBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  certificateOuterFrame: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 16,
  },
  certificateInnerFrame: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D4AF37', // Gold trim
    padding: 18,
    alignItems: 'center',
    backgroundColor: '#FFFEFA',
  },
  emblemContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  emblemCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  authorityTitle: {
    fontSize: 13,
    fontFamily: 'Inter_900Black',
    color: '#0F172A',
    letterSpacing: 1.2,
  },
  authoritySub: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#64748B',
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
  },
  certDivider: {
    width: '60%',
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  certHeading: {
    fontSize: 17,
    fontFamily: 'Inter_900Black',
    color: '#B91C1C',
    letterSpacing: 0.8,
    marginBottom: 6,
    textAlign: 'center',
  },
  presentedText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 10,
  },
  donorNameText: {
    fontSize: 22,
    fontFamily: 'Inter_800ExtraBold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  bloodGroupPill: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  bloodGroupPillText: {
    fontSize: 11,
    fontFamily: 'Inter_800ExtraBold',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  citationText: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 10,
    fontStyle: 'italic',
  },
  detailsGrid: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  gridItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  gridValue: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    marginTop: 8,
  },
  signatureBox: {
    alignItems: 'center',
    width: '32%',
  },
  signatureLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#CBD5E1',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#64748B',
  },
  signatureTitle: {
    fontSize: 9,
    color: '#94A3B8',
  },
  verifiedStamp: {
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 2,
  },
  verifiedStampText: {
    fontSize: 8,
    fontFamily: 'Inter_800ExtraBold',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    marginBottom: 16,
  },
  verifyBannerTitle: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  verifyBannerCode: {
    fontSize: 16,
    fontFamily: 'Inter_800ExtraBold',
    color: colors.primary,
    letterSpacing: 0.5,
    marginVertical: 2,
  },
  verifyBannerSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  shareActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  shareActionBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
});
