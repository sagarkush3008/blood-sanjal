import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { CertificatesAPI } from '../../api/rewards.api';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';

export const VerifyCertificateScreen = () => {
  const [code, setCode] = useState('');
  const [submittedCode, setSubmittedCode] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['verify-cert', submittedCode],
    queryFn: () => CertificatesAPI.verify(submittedCode).then(res => res.data.data || res.data),
    enabled: !!submittedCode,
    retry: false,
  });

  const handleVerify = () => {
    if (!code.trim()) {
      Alert.alert("Validation Error", "Please enter a certificate code.");
      return;
    }
    setSubmittedCode(code.trim());
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Verify Certificate</Text>
      <Text style={styles.description}>Enter the unique certificate code below to verify the authenticity of a blood donation certificate.</Text>

      <View style={styles.inputContainer}>
        <InputField 
          label="Certificate Verification Code" 
          placeholder="e.g. CERT-12345" 
          value={code} 
          onChangeText={setCode} 
        />
        <PrimaryButton title="Verify Now" onPress={handleVerify} />
      </View>

      <View style={styles.resultContainer}>
        {isLoading && <ActivityIndicator size="large" color={colors.primary} />}
        {error && <Text style={styles.errorText}>Invalid or expired certificate code.</Text>}
        
        {data && (
          <View style={styles.certCard}>
            <Text style={styles.certTitle}>✅ Verified Certificate</Text>
            <Text style={styles.detailText}>Code: {data.certificateCode}</Text>
            <Text style={styles.detailText}>Issued To: {data.userId?.name || 'Unknown User'}</Text>
            <Text style={styles.detailText}>Issue Date: {new Date(data.issuedAt).toLocaleDateString()}</Text>
          </View>
        )}
      </View>
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
    marginBottom: spacing.s,
  },
  description: {
    ...typography.body2,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    padding: spacing.l,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  resultContainer: {
    marginTop: spacing.m,
  },
  errorText: {
    ...typography.body1,
    color: colors.danger,
    textAlign: 'center',
  },
  certCard: {
    backgroundColor: '#ECFDF5',
    padding: spacing.l,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success,
  },
  certTitle: {
    ...typography.h3,
    color: colors.success,
    marginBottom: spacing.m,
  },
  detailText: {
    ...typography.body1,
    color: colors.text,
    marginBottom: 4,
  }
});
