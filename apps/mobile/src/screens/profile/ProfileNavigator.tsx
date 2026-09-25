import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from './ProfileScreen';
import { PrivacySettingsScreen } from './PrivacySettingsScreen';
import { RewardsScreen } from './RewardsScreen';
import { SupportPlatformScreen } from './SupportPlatformScreen';
import { EditProfileScreen } from './EditProfileScreen';
import { VerifyCertificateScreen } from './VerifyCertificateScreen';
import { LogDonationScreen } from './LogDonationScreen';
import { AdminNavigator } from '../admin/AdminNavigator';
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
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} options={{ title: 'Privacy Settings' }} />
      <Stack.Screen name="Rewards" component={RewardsScreen} options={{ title: 'Achievements & Rewards' }} />
      <Stack.Screen name="VerifyCertificate" component={VerifyCertificateScreen} options={{ title: 'Verify Certificate' }} />
      <Stack.Screen name="LogDonation" component={LogDonationScreen} options={{ title: 'Log Donation' }} />
      <Stack.Screen name="SupportPlatform" component={SupportPlatformScreen} options={{ title: 'Support Platform' }} />
      <Stack.Screen name="Admin" component={AdminNavigator} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};
