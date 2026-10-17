import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RequestsScreen } from './RequestsScreen';
import { CreateRequestScreen } from './CreateRequestScreen';
import { CreateEmergencyRequestScreen } from './CreateEmergencyRequestScreen';
import { RequestDetailScreen } from './RequestDetailScreen';
import { colors } from '../../theme';

const Stack = createNativeStackNavigator();

export const RequestsNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontFamily: 'Inter_700Bold' },
      }}
    >
      <Stack.Screen
        name="RequestsList"
        component={RequestsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateRequest"
        component={CreateRequestScreen}
        options={{
          title: 'New Blood Request',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#0F172A' },
          headerTintColor: '#DC2626',
        }}
      />
      <Stack.Screen
        name="EmergencyRequest"
        component={CreateEmergencyRequestScreen}
        options={{ title: 'Emergency Broadcast' }}
      />
      <Stack.Screen
        name="RequestDetail"
        component={RequestDetailScreen}
        options={{ title: 'Request Details' }}
      />
    </Stack.Navigator>
  );
};
