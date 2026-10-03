import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { StatusBadge } from '../common/StatusBadge';

interface ContactRequestCardProps {
  type: 'RECEIVED' | 'SENT';
  otherPartyName: string;
  bloodGroup?: string;
  status: string;
  message?: string;
  createdAt?: string;
  contactInfo?: { phone?: string; email?: string };
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
}

export const ContactRequestCard: React.FC<ContactRequestCardProps> = ({
  type,
  otherPartyName,
  bloodGroup,
  status,
  message,
  createdAt,
  contactInfo,
  onAccept,
  onDecline,
  onCancel,
}) => {
  const isAccepted = status === 'ACCEPTED';
  const isPending = status === 'PENDING';

  const handleCall = () => {
    if (contactInfo?.phone) {
      Linking.openURL(`tel:${contactInfo.phone}`);
    }
  };

  const handleEmail = () => {
    if (contactInfo?.email) {
      Linking.openURL(`mailto:${contactInfo.email}`);
    }
  };

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.nameCol}>
          <Text style={styles.roleLabel}>
            {type === 'RECEIVED' ? 'Request From' : 'Request To'}
          </Text>
          <View style={styles.nameRow}>
            <Text style={styles.otherPartyName} numberOfLines={1}>
              {otherPartyName}
            </Text>
            {bloodGroup && (
              <View style={styles.bloodBadge}>
                <Text style={styles.bloodText}>{bloodGroup}</Text>
              </View>
            )}
          </View>
        </View>

        <StatusBadge status={status} />
      </View>

      {message ? (
        <View style={styles.messageBox}>
          <Ionicons name="chatbox-ellipses-outline" size={14} color="#64748B" style={{ marginTop: 2 }} />
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}

      {/* Revealed Contact Channels on Consent */}
      {isAccepted && contactInfo && (contactInfo.phone || contactInfo.email) ? (
        <View style={styles.revealedSection}>
          <View style={styles.revealedHeader}>
            <Ionicons name="lock-open" size={14} color="#065F46" />
            <Text style={styles.revealedTitle}>Authorized Contact Details</Text>
          </View>

          <View style={styles.contactRow}>
            {contactInfo.phone ? (
              <TouchableOpacity style={styles.contactChip} onPress={handleCall}>
                <Ionicons name="call" size={14} color="#FFFFFF" />
                <Text style={styles.contactChipText}>{contactInfo.phone}</Text>
              </TouchableOpacity>
            ) : null}

            {contactInfo.email ? (
              <TouchableOpacity style={styles.contactChipEmail} onPress={handleEmail}>
                <Ionicons name="mail" size={14} color="#0F172A" />
                <Text style={styles.contactChipEmailText}>{contactInfo.email}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : isPending && type === 'SENT' ? (
        <View style={styles.pendingNotice}>
          <Ionicons name="time-outline" size={14} color="#92400E" />
          <Text style={styles.pendingNoticeText}>
            Waiting for donor to review & approve contact reveal.
          </Text>
        </View>
      ) : null}

      {/* Actions */}
      {type === 'RECEIVED' && isPending && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.declineBtn} onPress={onDecline} activeOpacity={0.8}>
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.8}>
            <Ionicons name="checkmark-circle" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.acceptText}>Accept & Reveal</Text>
          </TouchableOpacity>
        </View>
      )}

      {type === 'SENT' && isPending && onCancel && (
        <View style={styles.actionRowSingle}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
            <Text style={styles.cancelText}>Cancel Request</Text>
          </TouchableOpacity>
        </View>
      )}

      {formattedDate ? (
        <Text style={styles.dateFooter}>{formattedDate}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  nameCol: {
    flex: 1,
    marginRight: 8,
  },
  roleLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  otherPartyName: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  bloodBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  bloodText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    flex: 1,
  },
  revealedSection: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 12,
  },
  revealedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  revealedTitle: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#065F46',
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  contactChipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  contactChipEmail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  contactChipEmailText: {
    color: '#0F172A',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  pendingNoticeText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  actionRowSingle: {
    marginTop: 6,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  declineText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#64748B',
  },
  acceptBtn: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  acceptText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'flex-start',
  },
  cancelText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#64748B',
  },
  dateFooter: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'right',
  },
});
