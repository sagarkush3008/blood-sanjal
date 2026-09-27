import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaymentScreen } from './PaymentScreen';
import { PaymentHistoryScreen } from './PaymentHistoryScreen';
import { colors } from '../../theme';

const Stack = createNativeStackNavigator();

export const PaymentsNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="PaymentMain" component={PaymentScreen} />
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
    </Stack.Navigator>
  );
};
