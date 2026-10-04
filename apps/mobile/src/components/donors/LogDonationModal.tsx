import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { AuthAPI } from '../../api/auth.api'; // Assume we will add logAndAnalyze to AuthAPI

export const LogDonationModal = ({ onClose, onSuccess }: any) => {
  const [form, setForm] = useState({
    recentTattoos: false,
    onAntibiotics: false,
    weight: 65, // Could be pre-filled from user profile
    age: 25     // Could be pre-filled from user profile
  });

  const analyzeMutation = useMutation({
    // You should add this to AuthAPI in client
    mutationFn: (data: any) => AuthAPI.logDonation(data),
    onSuccess: () => onSuccess()
  });

  const handleSubmit = () => {
    analyzeMutation.mutate({
      ...form,
      lastDonationDate: new Date().toISOString()
    });
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <Text style={styles.title}>Log Donation & Analyze</Text>
        <Text style={styles.subtitle}>Answer these quick questions for AI health insights.</Text>

        <View style={styles.question}>
          <Text style={styles.label}>Got any tattoos in the last 6 months?</Text>
          <Switch 
            value={form.recentTattoos} 
            onValueChange={(val) => setForm({...form, recentTattoos: val})} 
          />
        </View>

        <View style={styles.question}>
          <Text style={styles.label}>Currently taking any antibiotics?</Text>
          <Switch 
            value={form.onAntibiotics} 
            onValueChange={(val) => setForm({...form, onAntibiotics: val})} 
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn} disabled={analyzeMutation.isPending}>
            {analyzeMutation.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>Analyze & Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 20, marginTop: 4 },
  question: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  label: { flex: 1, fontSize: 14, color: '#334155', marginRight: 16 },
  footer: { flexDirection: 'row', gap: 12, marginTop: 10 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center' },
  cancelText: { color: '#64748B', fontWeight: 'bold' },
  submitBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#E11D48', alignItems: 'center' },
  submitText: { color: '#FFF', fontWeight: 'bold' }
});
