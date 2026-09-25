import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DonateScreen } from './DonateScreen';
import { RecordDonationScreen } from './RecordDonationScreen';
import { colors } from '../../theme';

const Stack = createNativeStackNavigator();

export const DonateNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="DonateHistory" component={DonateScreen} options={{ title: 'My Donations' }} />
      <Stack.Screen name="RecordDonation" component={RecordDonationScreen} options={{ title: 'Record a Donation' }} />
    </Stack.Navigator>
  );
};
