import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme';

export const LoginScreen = () => {
  const { setAuth } = useAuthStore();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <Text style={{ marginBottom: 20 }}>Login Screen Placeholder</Text>
      <Button title="Mock Login" color={colors.primary} onPress={() => setAuth('mock-token-123', { name: 'Demo User', role: 'USER' })} />
    </View>
  );
};

export const RegisterScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
    <Text>Register Screen Placeholder</Text>
  </View>
);
