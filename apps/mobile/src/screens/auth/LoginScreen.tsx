import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { AuthAPI } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';
import { useNavigation } from '@react-navigation/native';

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginScreen = () => {
  const { setAuth } = useAuthStore();
  const navigation = useNavigation<any>();
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => AuthAPI.login(data),
    onSuccess: (response) => {
      // Assuming response.data returns { token: { access, refresh }, user }
      // Check exact structure from OpenAPI, this assumes a standard pattern
      const { accessToken, user } = response.data.data || response.data;
      if (accessToken) {
        setAuth(accessToken, user);
      } else {
        setApiError('Login failed: Token missing from response');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to login. Please check credentials.';
      setApiError(message);
    }
  });

  const onSubmit = (data: LoginFormData) => {
    setApiError(null);
    loginMutation.mutate(data);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue saving lives.</Text>
      
      {apiError && <Text style={styles.apiError}>{apiError}</Text>}

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
        title="Sign In"
        onPress={handleSubmit(onSubmit)}
        loading={loginMutation.isPending}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.textMuted,
    ...typography.body1,
  },
  linkText: {
    color: colors.primary,
    ...typography.body1,
    fontWeight: 'bold',
  }
});
