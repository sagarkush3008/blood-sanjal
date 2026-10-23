import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../theme';
import { PaymentsAPI } from '../../api/payments.api';

export type PaymentGatewayId = 'esewa' | 'khalti' | 'fonepay' | 'dev_test';

export interface PaymentGatewayOption {
  id: PaymentGatewayId;
  label: string;
  category?: string;
  brandColor?: string;
  brandBg?: string;
  badgeText?: string;
}

interface PaymentGatewayDetail {
  id: PaymentGatewayId;
  label: string;
  category: string;
  brandColor: string;
  brandBg: string;
  badgeText: string;
}

const PAYMENT_GATEWAYS: PaymentGatewayDetail[] = [
  {
    id: 'esewa',
    label: 'eSewa',
    category: 'Digital Wallet',
    brandColor: '#60BB46',
    brandBg: '#E8F5E9',
    badgeText: 'e',
  },
  {
    id: 'khalti',
    label: 'Khalti',
    category: 'Instant Pay',
    brandColor: '#5C2D91',
    brandBg: '#F3E8FF',
    badgeText: 'K',
  },
  {
    id: 'fonepay',
    label: 'Fonepay',
    category: 'QR & Interbank',
    brandColor: '#E31B23',
    brandBg: '#FEE2E2',
    badgeText: 'fp',
  },
  {
    id: 'dev_test',
    label: 'Dev Test Mode',
    category: 'Instant Sandbox',
    brandColor: '#475569',
    brandBg: '#F1F5F9',
    badgeText: 'DEV',
  },
];

export interface PaymentBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedBloodGroup?: string;
  amount?: string;
}

export const PaymentBottomSheet: React.FC<PaymentBottomSheetProps> = ({
  visible,
  onClose,
  onSuccess,
  selectedBloodGroup = 'B+',
  amount = '15.00',
}) => {
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayId>('esewa');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Clean numerical amount extraction
  const cleanAmount = amount.replace(/[^0-9.]/g, '') || '15.00';
  const [mainUnits, decimalUnits = '00'] = cleanAmount.includes('.')
    ? cleanAmount.split('.')
    : [cleanAmount, '00'];

  const handlePayAndReveal = async () => {
    setIsProcessing(true);
    try {
      // Authoritative platform fee confirmation
      await PaymentsAPI.confirmMockSearchFee();
      setIsProcessing(false);
      onSuccess();
    } catch (err: any) {
      setIsProcessing(false);
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Unable to complete platform maintenance fee. Please try again.';
      Alert.alert('Payment Notice', errMsg);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Subtle Top Pull Indicator */}
          <View style={styles.dragHandle} />

          {/* Header Row: Title, Subtitle, & Minimal Close Button */}
          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Platform Maintenance Fee</Text>
              <Text style={styles.headerSubtitle}>
                Verified instant unlock for {selectedBloodGroup} donors
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close payment sheet"
            >
              <Ionicons name="close" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Minimal Trust Badge (Soft Emerald Pill Callout) */}
          <View style={styles.noticeBox}>
            <View style={styles.noticeIconWrap}>
              <Ionicons name="shield-checkmark" size={15} color="#059669" />
            </View>
            <Text style={styles.noticeText}>
              The NPR 15 contribution powers server uptime and emergency broadcasts. Blood donation remains{' '}
              <Text style={styles.noticeBold}>100% voluntary & free.</Text>
            </Text>
          </View>

          {/* Amount Display (Executive Typography Lockup) */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>PLATFORM MAINTENANCE CONTRIBUTION</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencyPrefix}>NPR</Text>
              <Text style={styles.amountMain}>{mainUnits}</Text>
              <Text style={styles.amountDecimals}>.{decimalUnits}</Text>
            </View>
            <View style={styles.feeTag}>
              <Ionicons name="heart" size={11} color="#DC2626" style={styles.feeTagIcon} />
              <Text style={styles.feeTagText}>Non-Profit Server & SMS Infrastructure</Text>
            </View>
          </View>

          {/* Payment Gateways: Interactive 2x2 Grid with Authentic Brand Accents */}
          <View style={styles.gatewaysSection}>
            <Text style={styles.gatewaysLabel}>Select Payment Method</Text>
            <View style={styles.gatewaysGrid}>
              {PAYMENT_GATEWAYS.map((gw) => {
                const isSelected = selectedGateway === gw.id;
                return (
                  <Pressable
                    key={gw.id}
                    onPress={() => setSelectedGateway(gw.id)}
                    style={({ pressed }) => [
                      styles.gatewayCard,
                      isSelected ? styles.gatewayCardSelected : styles.gatewayCardUnselected,
                      pressed && styles.gatewayCardPressed,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    {/* Top Row: Brand Mark & Radio Indicator */}
                    <View style={styles.gatewayTopRow}>
                      <View style={[styles.brandBadge, { backgroundColor: gw.brandBg }]}>
                        <Text style={[styles.brandBadgeText, { color: gw.brandColor }]}>
                          {gw.badgeText}
                        </Text>
                      </View>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && (
                          <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                        )}
                      </View>
                    </View>

                    {/* Bottom: Name & Category Subtitle */}
                    <View style={styles.gatewayBottom}>
                      <Text
                        style={[
                          styles.gatewayLabel,
                          isSelected && styles.gatewayLabelSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {gw.label}
                      </Text>
                      <Text style={styles.gatewayCategory} numberOfLines={1}>
                        {gw.category}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Primary Action Button & Security Assurance */}
          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={[
                styles.payButton,
                isProcessing && styles.payButtonDisabled,
              ]}
              onPress={handlePayAndReveal}
              disabled={isProcessing}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={`Pay NPR 15 and reveal ${selectedBloodGroup} donors`}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.payButtonContent}>
                  <Ionicons
                    name="lock-closed"
                    size={16}
                    color="#FFFFFF"
                    style={styles.lockIcon}
                  />
                  <Text style={styles.payButtonText}>
                    Pay NPR 15 & Reveal Donors
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.securityRow}>
              <Ionicons name="shield-checkmark-outline" size={13} color="#94A3B8" style={{ marginRight: 5 }} />
              <Text style={styles.securityText}>256-Bit Encrypted • Instant Donor Access</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)', // Sleek dimmed backdrop
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF', // Pure white canvas
    borderTopLeftRadius: 28, // 28px modern rounded corners
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 12,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9', // Soft borderless gray circle
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4', // Soft mint / emerald
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  noticeIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: fonts.regular,
    color: '#166534',
    lineHeight: 16.5,
  },
  noticeBold: {
    fontFamily: fonts.bold,
    color: '#14532D',
  },
  amountSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  currencyPrefix: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: '#64748B',
    marginRight: 4,
    marginTop: 6,
  },
  amountMain: {
    fontSize: 42,
    fontFamily: fonts.bold,
    color: '#0F172A',
    letterSpacing: -1,
  },
  amountDecimals: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: '#64748B',
    marginTop: 6,
  },
  feeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  feeTagIcon: {
    marginRight: 5,
  },
  feeTagText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#475569',
  },
  gatewaysSection: {
    marginBottom: 20,
  },
  gatewaysLabel: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: '#334155',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  gatewaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  gatewayCard: {
    width: '48.2%',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
    minHeight: 84,
  },
  gatewayCardUnselected: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  gatewayCardSelected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  gatewayCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  gatewayTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  brandBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: {
    fontSize: 11.5,
    fontFamily: fonts.bold,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioCircleSelected: {
    borderColor: '#DC2626',
    backgroundColor: '#DC2626',
  },
  gatewayBottom: {
    marginTop: 2,
  },
  gatewayLabel: {
    fontSize: 13.5,
    fontFamily: fonts.semiBold,
    color: '#1E293B',
    letterSpacing: -0.2,
  },
  gatewayLabelSelected: {
    color: '#0F172A',
    fontFamily: fonts.bold,
  },
  gatewayCategory: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: '#94A3B8',
    marginTop: 2,
  },
  footerContainer: {
    width: '100%',
  },
  payButton: {
    width: '100%',
    backgroundColor: '#DC2626',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  },
  payButtonDisabled: {
    opacity: 0.65,
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    marginRight: 8,
  },
  payButtonText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  securityText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#94A3B8',
    letterSpacing: 0.1,
  },
});
