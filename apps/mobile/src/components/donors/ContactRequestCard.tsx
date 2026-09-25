import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface ContactRequestCardProps {
  type: 'RECEIVED' | 'SENT';
  otherPartyName: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  contactInfo?: { phone?: string; email?: string };
  onAccept?: () => void;
  onDecline?: () => void;
}

export const ContactRequestCard: React.FC<ContactRequestCardProps> = ({ 
  type, 
  otherPartyName, 
  status, 
  contactInfo, 
  onAccept, 
  onDecline 
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {type === 'RECEIVED' ? 'Request from:' : 'Request to:'} <Text style={{ fontWeight: 'bold' }}>{otherPartyName}</Text>
      </Text>
      
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Status: </Text>
        <Text style={[
          styles.statusBadge, 
          status === 'ACCEPTED' ? styles.statusAccepted :
          status === 'DECLINED' ? styles.statusDeclined :
          styles.statusPending
        ]}>
          {status}
        </Text>
      </View>

      {status === 'ACCEPTED' && contactInfo && (
        <View style={styles.contactDetails}>
          <Text style={styles.contactHeader}>Revealed Contact Info:</Text>
          {contactInfo.phone && <Text style={styles.contactText}>Phone: {contactInfo.phone}</Text>}
          {contactInfo.email && <Text style={styles.contactText}>Email: {contactInfo.email}</Text>}
        </View>
      )}

      {type === 'RECEIVED' && status === 'PENDING' && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={onAccept}>
            <Text style={styles.buttonText}>Accept & Reveal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.declineButton]} onPress={onDecline}>
            <Text style={styles.buttonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.s,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  statusLabel: {
    ...typography.body2,
    color: colors.textMuted,
  },
  statusBadge: {
    ...typography.caption,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
    fontWeight: 'bold',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  statusAccepted: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  statusDeclined: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  contactDetails: {
    backgroundColor: colors.surfaceSoft,
    padding: spacing.s,
    borderRadius: 8,
    marginTop: spacing.s,
  },
  contactHeader: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  contactText: {
    ...typography.body2,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.m,
    gap: spacing.s,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.s,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  declineButton: {
    backgroundColor: colors.danger,
  },
  buttonText: {
    color: colors.surface,
    ...typography.button,
    fontSize: 14,
  }
});
