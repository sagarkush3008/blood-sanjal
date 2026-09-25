import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { PaymentsAPI } from '../../api/payments.api';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';

const paymentSchema = z.object({
  amount: z.coerce.number().min(10, 'Minimum contribution is Rs. 10'),
  purpose: z.string(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export const SupportPlatformScreen = () => {
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  
  const { control, handleSubmit, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: 100, purpose: 'VOLUNTARY_DONATION' }
  });

  const payMutation = useMutation({
    mutationFn: (data: PaymentFormData) => PaymentsAPI.createPaymentIntent({ ...data, provider: 'MOCK' }),
    onSuccess: (res) => {
      // Mock payment flow: usually would open eSewa/Khalti URL, but we just simulate success here
      setPaymentStatus('Processing...');
      setTimeout(() => {
        setPaymentStatus('SUCCESS: Thank you for your contribution!');
        Alert.alert("Payment Successful", "Thank you for supporting Blood Sanjal. Blood itself is always free, your contribution helps keep our servers running.");
      }, 2000);
    },
    onError: (err: any) => {
      Alert.alert("Payment Failed", err.response?.data?.message || "Something went wrong.");
    }
  });

  const onSubmit = (data: PaymentFormData) => {
    setPaymentStatus(null);
    payMutation.mutate(data);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Support Blood Sanjal</Text>
      
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerTitle}>Blood is always Free.</Text>
        <Text style={styles.disclaimerText}>
          You are never paying for blood. This voluntary contribution helps us maintain our servers and send SMS notifications to donors. 
        </Text>
      </View>

      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField 
            label="Contribution Amount (Rs.)" 
            placeholder="100" 
            keyboardType="numeric" 
            onBlur={onBlur} 
            onChangeText={onChange} 
            value={value.toString()} 
            error={errors.amount?.message} 
          />
        )}
      />

      <View style={styles.spacer} />

      <PrimaryButton
        title="Contribute via Mock Provider"
        onPress={handleSubmit(onSubmit)}
        loading={payMutation.isPending}
      />

      {paymentStatus && (
        <View style={styles.statusBox}>
          {paymentStatus === 'Processing...' ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.statusText}>{paymentStatus}</Text>}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.l,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h2,
    color: colors.primaryDark,
    marginBottom: spacing.l,
  },
  disclaimerBox: {
    backgroundColor: '#FEF3C7',
    padding: spacing.m,
    borderRadius: 8,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  disclaimerTitle: {
    ...typography.body1,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 4,
  },
  disclaimerText: {
    ...typography.caption,
    color: '#92400E',
  },
  spacer: {
    height: spacing.m,
  },
  statusBox: {
    marginTop: spacing.xl,
    padding: spacing.m,
    alignItems: 'center',
  },
  statusText: {
    ...typography.body1,
    color: colors.success,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});
