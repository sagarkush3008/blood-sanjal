import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminAPI } from '../../api/admin.api';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';

export const AdminSettingsScreen = () => {
  const queryClient = useQueryClient();
  const [fee, setFee] = useState('10');
  const [autoVerify, setAutoVerify] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => AdminAPI.getSettings().then(res => res.data.data || res.data),
  });

  useEffect(() => {
    if (data) {
      setFee(data.platformFee?.toString() || '10');
      setAutoVerify(data.autoVerifyDonors || false);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => AdminAPI.updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      Alert.alert("Success", "System settings updated.");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.message || "Failed to update settings.");
    }
  });

  const handleSave = () => {
    updateMutation.mutate({
      platformFee: Number(fee),
      autoVerifyDonors: autoVerify,
    });
  };

  if (isLoading) return <View style={styles.container}><Text style={{marginTop: spacing.xl, textAlign: 'center'}}>Loading...</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>System Settings</Text>

      <View style={styles.card}>
        <InputField 
          label="Platform Fee (Rs.)"
          value={fee}
          onChangeText={setFee}
          keyboardType="numeric"
        />
        <Text style={styles.hint}>This fee applies to Contact Requests.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Auto-Verify Donors</Text>
            <Text style={styles.hint}>Automatically verify donors upon signup without admin review.</Text>
          </View>
          <Switch 
            value={autoVerify} 
            onValueChange={setAutoVerify} 
            trackColor={{ false: colors.border, true: colors.success }}
          />
        </View>
      </View>

      <View style={styles.spacer} />

      <PrimaryButton 
        title="Save Settings" 
        onPress={handleSave} 
        loading={updateMutation.isPending} 
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.l,
  },
  title: {
    ...typography.h2,
    color: colors.primaryDark,
    marginBottom: spacing.l,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 8,
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
    ...typography.body1,
    fontWeight: 'bold',
    color: colors.text,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  spacer: {
    height: spacing.xl,
  }
});
