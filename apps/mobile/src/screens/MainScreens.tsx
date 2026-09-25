import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';

export { HomeScreen } from './home/HomeScreen';

export { FindBloodScreen } from './findBlood/FindBloodScreen';

export { RequestsScreen } from './requests/RequestsScreen';
export { ContactRequestsScreen } from './contactRequests/ContactRequestsScreen';

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
