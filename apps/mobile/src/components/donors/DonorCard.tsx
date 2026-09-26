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
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  bloodBadge: {
    backgroundColor: '#FEF2F2',
    height: 40,
    width: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  bloodText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    marginRight: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginRight: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '400',
  },
  actionButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
