import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { AuthAPI } from '../../api/auth.api';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';
import { useNavigation } from '@react-navigation/native';

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '' }
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormData) => AuthAPI.register(data),
    onSuccess: (response: any) => {
      // API typically returns the user object, so we pass the user ID to the verify screen
      const userId = response?.data?.data?.user?.id || response?.data?.data?.id || response?.data?.data?._id;
      if (userId) {
        navigation.navigate('VerifyEmail', { userId });
      } else {
        navigation.navigate('Login');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to register.';
      setApiError(message);
    }
  });

  const onSubmit = (data: RegisterFormData) => {
    setApiError(null);
    registerMutation.mutate(data);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join Blood Sanjal today.</Text>
      
      {apiError && <Text style={styles.apiError}>{apiError}</Text>}

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField
            label="Full Name"
            placeholder="John Doe"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField
            label="Email Address"
            placeholder="john@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.email?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField
            label="Phone Number"
            placeholder="98XXXXXXXX"
            keyboardType="phone-pad"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.phone?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField
            label="Password"
            placeholder="********"
            secureTextEntry
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.password?.message}
          />
        )}
      />

      <View style={styles.spacer} />

      <PrimaryButton
        title="Register"
        onPress={handleSubmit(onSubmit)}
        loading={registerMutation.isPending}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.l,
    justifyContent: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body1,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  apiError: {
    color: colors.danger,
    marginBottom: spacing.m,
    ...typography.body2,
    textAlign: 'center',
  },
  spacer: {
    height: spacing.m,
  }
});
