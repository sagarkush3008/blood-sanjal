import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RewardsScreen } from './RewardsScreen';
import { CertificatesScreen } from '../certificates/CertificatesScreen';
import { CertificateDetailScreen } from '../certificates/CertificateDetailScreen';
import { colors } from '../../theme';

const Stack = createNativeStackNavigator();

export const RewardsNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="RewardsMain" component={RewardsScreen} />
      <Stack.Screen name="Certificates" component={CertificatesScreen} />
      <Stack.Screen name="CertificateDetail" component={CertificateDetailScreen} />
    </Stack.Navigator>
  );
};
