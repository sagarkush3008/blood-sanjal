import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LogDonationModal } from './LogDonationModal';

interface EligibilityCardProps {
  isEligible: boolean;
  nextEligibleDate: string | null;
  aiTips?: string[];
  daysRemaining?: number;
  onLogDonationComplete: () => void;
}

export const EligibilityCard = ({ 
  isEligible, 
  nextEligibleDate, 
  aiTips, 
  daysRemaining,
  onLogDonationComplete 
}: EligibilityCardProps) => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // Dynamic Styles
  const theme = isEligible 
    ? { bg: '#ECFDF5', border: '#10B981', text: '#047857', icon: '#059669' } // Bright Green
    : { bg: '#FFFBEB', border: '#F59E0B', text: '#B45309', icon: '#D97706' }; // Yellow/Warning

  return (
    <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      
      <View style={styles.header}>
        <Ionicons name="fitness-outline" size={24} color={theme.icon} />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text }]}>
            {isEligible ? 'Donation Eligibility Check' : 'Recovery Period Active'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.text }]}>
            {isEligible 
              ? 'You are eligible to save a life today! 🩸' 
              : `Eligible in ${daysRemaining || 0} Days (Next: ${nextEligibleDate || 'TBD'})`}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {isEligible ? (
          <>
            <TouchableOpacity style={[styles.button, { backgroundColor: '#10B981' }]}>
              <Text style={styles.buttonText}>Find Blood Camps</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.buttonOutline, { borderColor: '#10B981' }]}
              onPress={() => setShowLogModal(true)}
            >
              <Text style={[styles.buttonTextOutline, { color: '#047857' }]}>I Donated</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={[styles.button, { backgroundColor: '#F59E0B' }]}>
            <Text style={styles.buttonText}>Set Reminder</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* AI Insights Section */}
      {!isEligible && aiTips && aiTips.length > 0 && (
        <View style={styles.aiSection}>
          <TouchableOpacity onPress={() => setShowTips(!showTips)} style={styles.aiHeader}>
            <Ionicons name="sparkles" size={16} color="#6366F1" />
            <Text style={styles.aiTitle}>AI Health & Recovery Insights</Text>
            <Ionicons name={showTips ? "chevron-up" : "chevron-down"} size={16} color="#6366F1" style={{marginLeft: 'auto'}} />
          </TouchableOpacity>
          
          {showTips && (
            <View style={styles.tipsContainer}>
              {aiTips.map((tip, index) => (
                <View key={index} style={styles.tipRow}>
                  <Text style={styles.tipDot}>•</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Mini Questionnaire Modal */}
      <Modal visible={showLogModal} animationType="slide" transparent>
        <LogDonationModal 
          onClose={() => setShowLogModal(false)} 
          onSuccess={() => {
            setShowLogModal(false);
            onLogDonationComplete(); // Trigger React Query refetch here
          }} 
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginVertical: 10 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headerText: { marginLeft: 12, flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10 },
  button: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, flex: 1, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: 'bold' },
  buttonOutline: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, flex: 1, alignItems: 'center', justifyContent: 'center' },
  buttonTextOutline: { fontWeight: 'bold' },
  aiSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiTitle: { color: '#6366F1', fontWeight: '600', fontSize: 14 },
  tipsContainer: { marginTop: 12, gap: 8 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start' },
  tipDot: { color: '#64748B', marginRight: 6, fontSize: 16, lineHeight: 20 },
  tipText: { color: '#334155', fontSize: 13, flex: 1, lineHeight: 20 }
});
