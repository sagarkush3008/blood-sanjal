import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthAPI } from '../../api/auth.api';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';

export const PrivacySettingsScreen = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['privacy-settings'],
    queryFn: () => AuthAPI.getPrivacySettings().then(res => res.data.data || res.data),
  });

  const updateMutation = useMutation({
    mutationFn: (newSettings: any) => AuthAPI.updatePrivacySettings(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-settings'] });
      Alert.alert("Success", "Privacy settings updated.");
    },
    onError: () => {
      Alert.alert("Error", "Failed to update settings.");
    }
  });

  if (isLoading) {
    return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />;
  }

  const settings = data || {};

  const handleToggle = (key: string, value: boolean) => {
    updateMutation.mutate({ [key]: value });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.description}>
        Control how your information is shared on the Blood Sanjal platform. Your exact contact information is always hidden by default until you accept a contact request.
      </Text>

      <View style={styles.settingRow}>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>Available for Donation</Text>
          <Text style={styles.settingDesc}>Appear in donor search results.</Text>
        </View>
        <Switch
          value={settings.isAvailableForDonation !== false}
          onValueChange={(val) => handleToggle('isAvailableForDonation', val)}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>Hide Phone Number Entirely</Text>
          <Text style={styles.settingDesc}>Even if you accept a contact request, your phone number won't be shown.</Text>
        </View>
        <Switch
          value={settings.hidePhone === true}
          onValueChange={(val) => handleToggle('hidePhone', val)}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.l,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  description: {
    ...typography.body2,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.l,
    borderRadius: 12,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: spacing.m,
  },
  settingTitle: {
    ...typography.body1,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  settingDesc: {
    ...typography.caption,
    color: colors.textMuted,
  }
});
