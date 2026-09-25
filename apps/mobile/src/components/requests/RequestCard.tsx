import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

interface RequestCardProps {
  id?: string;
  bloodGroup: string;
  patientName?: string;
  location: string;
  unitsRequired?: number;
  urgency: 'NORMAL' | 'URGENT' | 'EMERGENCY' | string;
  status: string;
  details?: string;
  contactName?: string;
  contactPhone?: string;
  onPress?: () => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  id,
  bloodGroup,
  patientName = 'Patient in Need',
  location,
  unitsRequired = 1,
  urgency,
  status,
  details,
  contactName,
  contactPhone,
  onPress,
}) => {
  const isEmergency = urgency === 'EMERGENCY' || urgency === 'URGENT';
  const displayId = id ? `ID: BR-2026-${id.slice(-6).toUpperCase()}` : 'ID: BR-2026-ACTIVE';

  return (
    <TouchableOpacity
      style={[styles.container, isEmergency && styles.emergencyContainer]}
      onPress={onPress}
      activeOpacity={onPress ? 0.85 : 1}
    >
      {/* Top Badges Row */}
      <View style={styles.badgesRow}>
        <View style={[styles.urgencyBadge, isEmergency && styles.emergencyBadge]}>
          <Ionicons
            name={isEmergency ? 'warning' : 'information-circle'}
            size={11}
            color="#FFFFFF"
            style={{ marginRight: 4 }}
          />
          <Text style={styles.urgencyBadgeText}>{urgency}</Text>
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{status}</Text>
        </View>
      </View>

      {/* Patient Profile Row */}
      <View style={styles.patientRow}>
        <View style={styles.bloodTypeCircle}>
          <Text style={styles.bloodTypeCircleText}>{bloodGroup}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.patientName}>{patientName}</Text>
          <Text style={styles.requiredUnits}>
            Required: {unitsRequired} Unit(s) of {bloodGroup}
          </Text>
        </View>
      </View>

      {/* Location */}
      <View style={styles.locationRow}>
        <Ionicons name="location-sharp" size={15} color="#64748B" style={{ marginRight: 5, marginTop: 1 }} />
        <Text style={styles.locationText} numberOfLines={2}>
          {location || 'Hospital Location'}
        </Text>
      </View>

      {/* Details Box if available */}
      {details ? (
        <View style={styles.detailsBox}>
          <Text style={styles.detailsText} numberOfLines={2}>
            Details: {details}
          </Text>
        </View>
      ) : null}

      {/* Footer Contact & ID */}
      <View style={styles.footerRow}>
        <View style={{ flex: 1, paddingRight: 6 }}>
          <Text style={styles.contactLabel}>Requester Contact:</Text>
          <Text style={styles.contactValue} numberOfLines={1}>
            {contactName || 'Hospital Staff'} {contactPhone ? `• ${contactPhone}` : ''}
          </Text>
        </View>
        <Text style={styles.idText}>{displayId}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  emergencyContainer: {
    borderWidth: 2,
    borderColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOpacity: 0.08,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#64748B',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  emergencyBadge: {
    backgroundColor: '#DC2626',
  },
  urgencyBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadge: {
    backgroundColor: '#FFEDD5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: {
    color: '#C2410C',
    fontSize: 10,
    fontWeight: '800',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bloodTypeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodTypeCircleText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  requiredUnits: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    lineHeight: 17,
  },
  detailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  contactLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  contactValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  idText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
});
