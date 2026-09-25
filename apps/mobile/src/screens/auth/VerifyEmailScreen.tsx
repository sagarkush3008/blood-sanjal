import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { AuthAPI } from '../../api/auth.api';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { spacing } from '../../theme';

export const VerifyEmailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [code, setCode] = useState('');
  
  // The userId should be passed from the RegisterScreen navigation params
  const userId = route.params?.userId;

  const verifyMutation = useMutation({
    mutationFn: (data: any) => AuthAPI.verifyEmail(data),
    onSuccess: () => {
      Alert.alert('Email Verified! 🎉', 'Your BloodLink account is now fully active. You can now log in.', [
        { text: 'Go to Login', onPress: () => navigation.navigate('Login') }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Verification Failed', error.response?.data?.message || 'Invalid or expired code.');
    }
  });

  const handleVerify = () => {
    if (!code) {
      Alert.alert('Missing Code', 'Please enter the 6-digit verification code.');
      return;
    }
    if (!userId) {
      Alert.alert('Error', 'Missing user ID. Please register again.');
      return;
    }
    verifyMutation.mutate({ userId, code, purpose: 'REGISTRATION' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-open-outline" size={32} color="#DC2626" />
          </View>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit confirmation code to your email address to activate your donor profile.
          </Text>
        </View>

        <View style={styles.card}>
          <InputField
            label="6-Digit Verification Code"
            placeholder="• • • • • •"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            leftIcon="shield-checkmark-outline"
          />

          <View style={{ marginTop: spacing.m }}>
            <PrimaryButton 
              title="Verify & Continue" 
              icon="checkmark-done"
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
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B91C1C',
  },
});

