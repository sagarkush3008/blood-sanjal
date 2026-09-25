import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RequestsScreen } from './RequestsScreen';
import { CreateRequestScreen } from './CreateRequestScreen';
import { CreateEmergencyRequestScreen } from './CreateEmergencyRequestScreen';
import { colors } from '../../theme';

const Stack = createNativeStackNavigator();

export const RequestsNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="RequestsList" component={RequestsScreen} options={{ title: 'My Requests' }} />
      <Stack.Screen name="CreateRequest" component={CreateRequestScreen} options={{ title: 'New Blood Request' }} />
      <Stack.Screen name="EmergencyRequest" component={CreateEmergencyRequestScreen} options={{ title: 'Emergency Broadcast' }} />
    </Stack.Navigator>
  );
};
