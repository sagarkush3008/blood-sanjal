import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export const AboutScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Blood Sanjal</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.logoBadge}>
          <Ionicons name="heart-circle" size={48} color={colors.primary} />
        </View>
        <Text style={styles.brandTitle}>Blood Sanjal Nepal</Text>
        <Text style={styles.brandTagline}>Connected Lifesavers Across Nepal</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our Mission</Text>
          <Text style={styles.cardText}>
            Blood Sanjal bridges the critical gap between emergency blood recipients and voluntary donors
            across all 7 provinces and 77 districts of Nepal. By combining real-time coordination,
            strict donor privacy, and verified blood drives, we aim to ensure zero preventable deaths
            caused by acute blood shortages.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Platform Engineering</Text>
          <Text style={styles.cardText}>
            Engineered by <Text style={{ fontWeight: '700', color: '#0F172A' }}>Evolvix Infotech</Text> in
            partnership with humanitarian health advocates and certified medical facilities in Nepal.
          </Text>
        </View>

        <Text style={styles.copyright}>© 2026 Blood Sanjal • All Rights Reserved</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  scrollContent: { padding: 20, alignItems: 'center' },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  brandTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 2 },
  brandTagline: { fontSize: 13, color: '#64748B', marginBottom: 20 },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  cardText: { fontSize: 12, color: '#475569', lineHeight: 18 },
  copyright: { fontSize: 11, color: '#94A3B8', marginTop: 20 },
});
