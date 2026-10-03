import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from './ProfileScreen';
import { PrivacySettingsScreen } from './PrivacySettingsScreen';
import { RewardsScreen } from './RewardsScreen';
import { SupportPlatformScreen } from './SupportPlatformScreen';
import { EditProfileScreen } from './EditProfileScreen';
import { DonorAvailabilityScreen } from './DonorAvailabilityScreen';
import { VerifyCertificateScreen } from './VerifyCertificateScreen';
import { LogDonationScreen } from './LogDonationScreen';
import { PaymentHistoryScreen } from './PaymentHistoryScreen';
import { AdminNavigator } from '../admin/AdminNavigator';
import { CertificatesNavigator } from '../certificates/CertificatesNavigator';
import { SettingsNavigator } from '../settings/SettingsNavigator';
import { PaymentsNavigator } from '../payments/PaymentsNavigator';
import { colors } from '../../theme';

const Stack = createNativeStackNavigator();

export const ProfileNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontFamily: 'Inter_700Bold' },
      }}
    >
      <Stack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="DonorAvailability" component={DonorAvailabilityScreen} options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} options={{ title: 'Privacy Settings' }} />
      <Stack.Screen name="Rewards" component={RewardsScreen} options={{ title: 'Achievements & Rewards' }} />
      <Stack.Screen name="Certificates" component={CertificatesNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Payments" component={PaymentsNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="VerifyCertificate" component={VerifyCertificateScreen} options={{ title: 'Verify Certificate' }} />
      <Stack.Screen name="LogDonation" component={LogDonationScreen} options={{ title: 'Log Donation' }} />
      <Stack.Screen name="SupportPlatform" component={SupportPlatformScreen} options={{ title: 'Support Platform' }} />
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} options={{ title: 'Contribution History' }} />
      <Stack.Screen name="Admin" component={AdminNavigator} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};
