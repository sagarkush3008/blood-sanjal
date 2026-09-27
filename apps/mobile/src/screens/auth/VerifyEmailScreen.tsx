import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { AuthAPI } from '../../api/auth.api';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing } from '../../theme';

export const VerifyEmailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [code, setCode] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);

  // userId passed from RegisterScreen
  const userId = route.params?.userId;
  const email = route.params?.email || 'your email';

  useEffect(() => {
    let interval: any = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const verifyMutation = useMutation({
    mutationFn: (data: any) => AuthAPI.verifyEmail(data),
    onSuccess: () => {
      Alert.alert(
        'Account Activated! 🎉',
        'Your Blood Sanjal account is now active. Please sign in to continue.',
        [{ text: 'Sign In', onPress: () => navigation.navigate('Login') }]
      );
    },
    onError: (error: any) => {
      const msg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'The verification code is invalid or has expired.';
      setApiError(msg);
    },
  });

  const handleVerify = () => {
    setApiError(null);
    if (!code || code.trim().length !== 6) {
      setApiError('Please enter a valid 6-digit verification code.');
      return;
    }
    if (!userId) {
      setApiError('Missing user session reference. Please register again.');
      return;
    }
    verifyMutation.mutate({
      userId,
      code: code.trim(),
      purpose: 'REGISTRATION',
    });
  };

  const handleResend = () => {
    if (!canResend) return;
    setTimer(60);
    setCanResend(false);
    setApiError(null);
    Alert.alert(
      'Code Resent',
      `A fresh verification code has been dispatched to ${email}.`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-open-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.brandTitle}>Blood Sanjal</Text>
          <Text style={styles.title}>Verify Your Account</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit verification code sent to{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
        </View>

        <View style={styles.card}>
          {apiError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{apiError}</Text>
            </View>
          )}

          <InputField
            label="6-Digit Verification Code"
            placeholder="• • • • • •"
            value={code}
            onChangeText={(val) => {
              setCode(val);
              if (apiError) setApiError(null);
            }}
            keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
            maxLength={6}
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon="shield-checkmark-outline"
          />

          <View style={styles.timerRow}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendActiveText}>Resend Code</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>
                Resend code in <Text style={styles.timerCount}>{timer}s</Text>
              </Text>
            )}
          </View>

          <View style={{ marginTop: spacing.m }}>
            <PrimaryButton
              title="Verify & Activate"
              icon="checkmark-done-circle-outline"
              onPress={handleVerify}
              loading={verifyMutation.isPending}
            />
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backButtonText}>Return to Sign In</Text>
          </TouchableOpacity>
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  emailHighlight: {
    fontWeight: '700',
    color: '#0F172A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: spacing.s + 4,
    marginBottom: spacing.m,
    gap: 8,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  timerRow: {
    alignItems: 'center',
    marginVertical: 12,
  },
  timerText: {
    fontSize: 13,
    color: '#64748B',
  },
  timerCount: {
    fontWeight: '700',
    color: '#0F172A',
  },
  resendActiveText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});
