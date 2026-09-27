import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminAPI } from '../../api/admin.api';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';

export const AdminSettingsScreen = () => {
  const queryClient = useQueryClient();
  const [fee, setFee] = useState('50');
  const [donationInterval, setDonationInterval] = useState('90');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistrations, setAllowRegistrations] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => AdminAPI.getSettings().then(res => res.data.data || res.data),
  });

  useEffect(() => {
    if (data) {
      if (data.platformFee?.amountMinor !== undefined) {
        setFee((data.platformFee.amountMinor / 100).toString());
      } else if (typeof data.platformFee === 'number') {
        setFee(data.platformFee.toString());
      }
      if (data.reminderPolicy?.donationIntervalDays) {
        setDonationInterval(data.reminderPolicy.donationIntervalDays.toString());
      }
      if (data.systemToggles) {
        setMaintenanceMode(data.systemToggles.maintenanceMode ?? false);
        setAllowRegistrations(data.systemToggles.allowNewRegistrations ?? true);
      }
      if (data.notificationDefaults) {
        setEmailEnabled(data.notificationDefaults.emailEnabled ?? true);
        setPushEnabled(data.notificationDefaults.pushEnabled ?? true);
      }
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => AdminAPI.updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      Alert.alert("Success", "System settings updated successfully.");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.message || "Failed to update settings.");
    }
  });

  const reminderMutation = useMutation({
    mutationFn: () => AdminAPI.triggerReminders(),
    onSuccess: (res: any) => {
      const count = res.data?.data?.processedCount ?? 0;
      Alert.alert("Reminders Triggered", `Successfully evaluated and scheduled reminders for ${count} eligible donors.`);
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.message || "Failed to trigger reminders.");
    }
  });

  const handleSave = () => {
    const feeNpr = Number(fee) || 0;
    const intervalDays = Number(donationInterval) || 90;

    const payload = {
      platformFee: {
        amountMinor: Math.round(feeNpr * 100),
        currency: 'NPR'
      },
      reminderPolicy: {
        donationIntervalDays: Math.max(30, Math.min(180, intervalDays)),
        maxRemindersPerMonth: 3
      },
      systemToggles: {
        maintenanceMode,
        allowNewRegistrations: allowRegistrations
      },
      notificationDefaults: {
        emailEnabled,
        smsEnabled: false,
        pushEnabled
      }
    };

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>System Settings & Policy</Text>

      {/* Financials & Search Fee */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>💳 Financial Transparency & Search Fee</Text>
        <InputField 
          label="Search Fee Amount (NPR)"
          value={fee}
          onChangeText={setFee}
          keyboardType="numeric"
        />
        <Text style={styles.hint}>Flat platform fee charged to recipients before revealing verified donors.</Text>
      </View>

      {/* Clinical Reminder Policy */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>🩸 Donor Eligibility & Reminders</Text>
        <InputField 
          label="Donation Cooldown Interval (Days)"
          value={donationInterval}
          onChangeText={setDonationInterval}
          keyboardType="numeric"
        />
        <Text style={styles.hint}>Clinical recovery period between donations (default 90 days).</Text>

        <TouchableOpacity 
          style={styles.triggerButton}
          onPress={() => reminderMutation.mutate()}
          disabled={reminderMutation.isPending}
        >
          {reminderMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={styles.triggerButtonText}>⚡ Trigger Eligibility Reminders Now</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* System Toggles */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>⚙️ System Toggles</Text>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Allow New Registrations</Text>
            <Text style={styles.hint}>Enable or disable onboarding of new users and donors.</Text>
          </View>
          <Switch 
            value={allowRegistrations} 
            onValueChange={setAllowRegistrations} 
            trackColor={{ false: colors.border, true: colors.success }}
          />
        </View>

        <View style={[styles.switchRow, { marginTop: spacing.m }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Platform Maintenance Mode</Text>
            <Text style={styles.hint}>Temporarily place application in maintenance state.</Text>
          </View>
          <Switch 
            value={maintenanceMode} 
            onValueChange={setMaintenanceMode} 
            trackColor={{ false: colors.border, true: colors.danger }}
          />
        </View>
      </View>

      {/* Notification Defaults */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>🔔 Notification Channels</Text>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Email Dispatch (Nodemailer)</Text>
            <Text style={styles.hint}>Deliver automated transactional and emergency emails.</Text>
          </View>
          <Switch 
            value={emailEnabled} 
            onValueChange={setEmailEnabled} 
            trackColor={{ false: colors.border, true: colors.success }}
          />
        </View>

        <View style={[styles.switchRow, { marginTop: spacing.m }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Push / In-App Alerts</Text>
            <Text style={styles.hint}>Broadcast instant in-app alerts for blood matches.</Text>
          </View>
          <Switch 
            value={pushEnabled} 
            onValueChange={setPushEnabled} 
            trackColor={{ false: colors.border, true: colors.success }}
          />
        </View>
      </View>

      <View style={styles.spacer} />

      <PrimaryButton 
        title="Save Platform Configuration" 
        onPress={handleSave} 
        loading={updateMutation.isPending} 
      />
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.m,
  },
  title: {
    ...typography.h2,
    color: colors.primaryDark,
    marginBottom: spacing.m,
  },
  sectionHeader: {
    ...typography.body1,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.s,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    ...typography.body2,
    fontWeight: 'bold',
    color: colors.text,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  triggerButton: {
    marginTop: spacing.m,
    backgroundColor: colors.primary,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: 8,
    alignItems: 'center',
  },
  triggerButtonText: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.surface,
  },
  spacer: {
    height: spacing.s,
  }
});
