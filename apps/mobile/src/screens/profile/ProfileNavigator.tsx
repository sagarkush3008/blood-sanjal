import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from './ProfileScreen';
import { PrivacySettingsScreen } from './PrivacySettingsScreen';
import { RewardsScreen } from './RewardsScreen';
import { SupportPlatformScreen } from './SupportPlatformScreen';
import { colors } from '../../theme';

const Stack = createNativeStackNavigator();

export const ProfileNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} options={{ title: 'Privacy Settings' }} />
      <Stack.Screen name="Rewards" component={RewardsScreen} options={{ title: 'Achievements & Rewards' }} />
      <Stack.Screen name="SupportPlatform" component={SupportPlatformScreen} options={{ title: 'Support Platform' }} />
    </Stack.Navigator>
  );
};
