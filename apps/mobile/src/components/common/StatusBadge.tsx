import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

export type BackendStatus =
  | 'PENDING'
  | 'PENDING_VERIFICATION'
  | 'ACTIVE'
  | 'MATCHING'
  | 'FULFILLED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUBMITTED'
  | 'URGENT'
  | 'NORMAL'
  | 'EMERGENCY'
  | 'SUCCESS'
  | 'FAILED'
  | 'SUSPENDED'
  | 'DRAFT'
  | 'PUBLISHED'
  | 'COMPLETED'
  | string;

interface StatusBadgeProps {
  status: BackendStatus;
  style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
  const getBadgeConfig = (s: string) => {
    switch (s?.toUpperCase()) {
      case 'ACTIVE':
      case 'VERIFIED':
      case 'ACCEPTED':
      case 'SUCCESS':
      case 'COMPLETED':
      case 'PUBLISHED':
        return {
          label: s.replace(/_/g, ' '),
          bg: '#ECFDF5',
          text: '#065F46',
          border: '#A7F3D0',
        };
      case 'PENDING':
      case 'PENDING_VERIFICATION':
      case 'SUBMITTED':
      case 'MATCHING':
        return {
          label: s === 'PENDING_VERIFICATION' ? 'Verification Pending' : s.replace(/_/g, ' '),
          bg: '#FFFBEB',
          text: '#92400E',
          border: '#FDE68A',
        };
      case 'URGENT':
      case 'EMERGENCY':
        return {
          label: s,
          bg: '#FEF2F2',
          text: '#991B1B',
          border: '#FECACA',
        };
      case 'REJECTED':
      case 'CANCELLED':
      case 'DECLINED':
      case 'FAILED':
      case 'SUSPENDED':
        return {
          label: s.replace(/_/g, ' '),
          bg: '#F8FAFC',
          text: '#475569',
          border: '#E2E8F0',
        };
      case 'NORMAL':
        return {
          label: 'Normal',
          bg: '#F0FDF4',
          text: '#166534',
          border: '#BBF7D0',
        };
      case 'CLOSED':
      case 'ARCHIVED':
      case 'EXPIRED':
        return {
          label: s.replace(/_/g, ' '),
          bg: '#F1F5F9',
          text: '#64748B',
          border: '#CBD5E1',
        };
      default:
        return {
          label: s || 'UNKNOWN',
          bg: '#F8FAFC',
          text: '#475569',
          border: '#E2E8F0',
        };
    }
  };

  const config = getBadgeConfig(status);

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.border },
        style,
      ]}
    >
      <Text style={[styles.badgeText, { color: config.text }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
