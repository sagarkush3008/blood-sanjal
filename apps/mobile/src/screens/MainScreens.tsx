import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';

export const HomeScreen = () => {
  const { logout } = useAuthStore();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <Text style={{ marginBottom: 20 }}>Home Screen</Text>
      <Button title="Logout" color={colors.danger} onPress={logout} />
    </View>
  );
};

export const FindBloodScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
    <Text>Find Blood Screen</Text>
  </View>
);

export const RequestsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
    <Text>Requests Screen</Text>
  </View>
);

export const DonateScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
    <Text>Donate Screen</Text>
  </View>
);

export const ProfileScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
    <Text>Profile Screen</Text>
  </View>
);
