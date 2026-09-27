import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CertificatesScreen } from './CertificatesScreen';
import { CertificateDetailScreen } from './CertificateDetailScreen';
import { colors } from '../../theme';

const Stack = createNativeStackNavigator();

export const CertificatesNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CertificatesList" component={CertificatesScreen} />
      <Stack.Screen name="CertificateDetail" component={CertificateDetailScreen} />
    </Stack.Navigator>
  );
};
