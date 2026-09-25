import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

interface DonorCardProps {
  name: string;
  bloodGroup: string;
  location: string;
  status: string;
  onRequestContact: () => void;
}

export const DonorCard: React.FC<DonorCardProps> = ({ name, bloodGroup, location, status, onRequestContact }) => {
  const isVerified = status === 'Verified' || status === 'ACTIVE';

  return (
    <View style={styles.container}>
      {/* Blood Badge */}
      <View style={styles.bloodBadge}>
        <Ionicons name="water" size={14} color="#FFFFFF" style={{ marginBottom: 1 }} />
        <Text style={styles.bloodText}>{bloodGroup}</Text>
      </View>

      {/* Info Column */}
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#15803D" style={{ marginRight: 3 }} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={13} color="#64748B" style={{ marginRight: 4 }} />
          <Text style={styles.location} numberOfLines={1}>{location || 'Nepal'}</Text>
        </View>
      </View>

      {/* Request Contact Button */}
      <TouchableOpacity style={styles.actionButton} onPress={onRequestContact} activeOpacity={0.8}>
        <Ionicons name="call" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
        <Text style={styles.actionText}>Contact</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bloodBadge: {
    backgroundColor: colors.primary,
    height: 48,
    width: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bloodText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  content: {
    flex: 1,
    marginRight: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
