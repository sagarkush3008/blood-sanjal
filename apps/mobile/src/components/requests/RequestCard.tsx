import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
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
  const isEmergency = urgency === 'EMERGENCY';
  const isUrgent = urgency === 'URGENT';
  const isNormal = !isEmergency && !isUrgent;

  let borderColor = '#E2E8F0';
  if (isEmergency) borderColor = '#FCA5A5';

  return (
    <View style={[styles.card, { borderColor }]}>
      {/* TOP ROW */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <View style={styles.bloodPill}>
             <Ionicons name="water" size={10} color="#FFF" style={{marginRight: 2}}/>
             <Text style={styles.bloodPillText}>{bloodGroup}</Text>
          </View>
          <View>
            <Text style={styles.unitsText}>{unitsRequired} Units Required</Text>
            <Text style={styles.requesterText}>Requested by {patientName}</Text>
          </View>
        </View>
        
        <View style={[styles.urgencyPill, isEmergency && styles.urgencyEmergency, isUrgent && styles.urgencyUrgent, isNormal && styles.urgencyNormal]}>
          <Text style={[styles.urgencyPillText, isEmergency && styles.urgencyTextEmergency, isUrgent && styles.urgencyTextUrgent, isNormal && styles.urgencyTextNormal]}>
            {urgency === 'NORMAL' ? 'Normal Urgency' : urgency}
          </Text>
        </View>
      </View>

      {/* HOSPITAL & LOCATION */}
      <View style={styles.hospitalRow}>
         <Feather name="plus-square" size={14} color="#DC2626" style={{marginTop: 2}} />
         <Text style={styles.hospitalText}>{location || 'Hospital Location'}</Text>
      </View>
      
      {/* DATE & TIME */}
      <View style={styles.dateTimeRow}>
         <Feather name="calendar" size={12} color="#3B82F6" />
         <Text style={styles.dateTimeText}>2026-05-15</Text>
         <View style={{width: 12}} />
         <Feather name="clock" size={12} color="#F59E0B" />
         <Text style={styles.dateTimeText}>11:00 AM</Text>
      </View>
      
      {/* DETAILS */}
      <Text style={styles.detailsText} numberOfLines={2}>
         "{details || 'Urgent requirement for blood units. Please donate.'}"
      </Text>
      
      {/* FOOTER ACTIONS */}
      <View style={styles.footerRow}>
         <View style={styles.verifiedPill}>
           <Ionicons name="checkmark" size={12} color="#059669" style={{marginRight: 4}} />
           <Text style={styles.verifiedText}>Verified Request</Text>
         </View>
         
         <TouchableOpacity style={[styles.actionBtn, isEmergency ? styles.actionBtnEmergency : styles.actionBtnNormal]} onPress={onPress}>
           <Text style={styles.actionBtnText}>View & Respond</Text>
         </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bloodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bloodPillText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  unitsText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  requesterText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  urgencyPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyEmergency: { backgroundColor: '#DC2626' },
  urgencyUrgent: { backgroundColor: '#F59E0B' },
  urgencyNormal: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#94A3B8' },
  
  urgencyPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  urgencyTextEmergency: { color: '#FFFFFF' },
  urgencyTextUrgent: { color: '#FFFFFF' },
  urgencyTextNormal: { color: '#475569' },

  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 8,
    paddingRight: 10,
  },
  hospitalText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  dateTimeText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  detailsText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    lineHeight: 16,
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnEmergency: { backgroundColor: '#DC2626' },
  actionBtnNormal: { backgroundColor: '#0F172A' },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  }
});
