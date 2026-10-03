import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { AuthAPI } from '../../api/auth.api';
import { colors, spacing } from '../../theme';

export const PrivacySettingsScreen = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['privacy-settings'],
    queryFn: () => AuthAPI.getPrivacySettings().then((res) => res.data?.data || res.data),
  });

  const updateMutation = useMutation({
    mutationFn: (newSettings: any) => AuthAPI.updatePrivacySettings(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-settings'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      Alert.alert('Saved', 'Your donor privacy settings have been updated.');
    },
    onError: (err: any) => {
      Alert.alert(
        'Update Failed',
        err.response?.data?.error?.message || err.response?.data?.message || 'Could not update privacy preferences.'
      );
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const settings = data || {};
  const donorSearchVisibility = settings.donorSearchVisibility ?? true;
  const emergencyNotifications = settings.emergencyNotifications ?? true;
  const approximateLocationSharing = settings.approximateLocationSharing ?? true;
  const contactRevealPolicy = settings.contactRevealPolicy || 'CONSENT_REQUIRED';

  const handleToggle = (key: string, value: any) => {
    updateMutation.mutate({ [key]: value });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Privacy Promise Banner */}
        <View style={styles.promiseBanner}>
          <Ionicons name="shield-checkmark" size={24} color="#059669" />
          <View style={{ flex: 1 }}>
            <Text style={styles.promiseTitle}>Strict Donor Privacy Protocol</Text>
            <Text style={styles.promiseText}>
              Your phone number, exact coordinates, and personal identity remain 100% private.
              Contact details can ONLY be revealed after a recipient initiates a request and you explicitly tap Accept.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Search & Discovery</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Donor Search Visibility</Text>
              <Text style={styles.settingDesc}>
                Allow patients and blood banks to find your blood group when searching within your city or district.
              </Text>
            </View>
            <Switch
              value={donorSearchVisibility}
              onValueChange={(val) => handleToggle('donorSearchVisibility', val)}
              trackColor={{ true: colors.primary, false: '#CBD5E1' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Approximate Location Only</Text>
              <Text style={styles.settingDesc}>
                Share only your city and district in search results to protect your physical residence.
              </Text>
            </View>
            <Switch
              value={approximateLocationSharing}
              onValueChange={(val) => handleToggle('approximateLocationSharing', val)}
              trackColor={{ true: colors.primary, false: '#CBD5E1' }}
            />
          </View>
        </View>

        <Text style={styles.sectionHeading}>Contact Reveal Policy</Text>

        <View style={styles.policyCard}>
          <TouchableOpacity
            style={[
              styles.policyOption,
              contactRevealPolicy === 'CONSENT_REQUIRED' && styles.policyOptionActive,
            ]}
            onPress={() => handleToggle('contactRevealPolicy', 'CONSENT_REQUIRED')}
            activeOpacity={0.8}
          >
            <View style={styles.policyRadioCircle}>
              {contactRevealPolicy === 'CONSENT_REQUIRED' && <View style={styles.policyRadioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.policyTitle}>Consent Required (Recommended)</Text>
              <Text style={styles.policySub}>
                Recipients must send a request. Your phone number is revealed only if you explicitly accept.
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[
              styles.policyOption,
              contactRevealPolicy === 'HIDDEN' && styles.policyOptionActive,
            ]}
            onPress={() => handleToggle('contactRevealPolicy', 'HIDDEN')}
            activeOpacity={0.8}
          >
            <View style={styles.policyRadioCircle}>
              {contactRevealPolicy === 'HIDDEN' && <View style={styles.policyRadioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.policyTitle}>Completely Hidden</Text>
              <Text style={styles.policySub}>
                Never reveal your phone number on mobile. You will only be reachable via in-app notifications.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeading}>Emergency Broadcasts</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Critical Emergency Alerts</Text>
              <Text style={styles.settingDesc}>
                Receive notifications when an ICU or trauma ward hospital verifies a critical emergency for your blood group.
              </Text>
            </View>
            <Switch
              value={emergencyNotifications}
              onValueChange={(val) => handleToggle('emergencyNotifications', val)}
              trackColor={{ true: colors.primary, false: '#CBD5E1' }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 16,
    paddingBottom: 36,
  },
  promiseBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 12,
    marginBottom: 20,
  },
  promiseTitle: {
    fontSize: 13,
    fontFamily: 'Inter_800ExtraBold',
    color: '#065F46',
    marginBottom: 2,
  },
  promiseText: {
    fontSize: 11,
    color: '#047857',
    lineHeight: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontFamily: 'Inter_800ExtraBold',
    color: '#0F172A',
    marginBottom: 10,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 14,
  },
  settingTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  policyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  policyOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    gap: 12,
  },
  policyOptionActive: {
    opacity: 1,
  },
  policyRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  policyRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  policyTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  policySub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
});
