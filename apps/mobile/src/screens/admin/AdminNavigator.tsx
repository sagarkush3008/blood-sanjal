import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminDashboardScreen } from './AdminDashboardScreen';
import { AdminEmergencyReviewScreen } from './AdminEmergencyReviewScreen';
import { colors } from '../../theme';

const Stack = createNativeStackNavigator();

export const AdminNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.danger },
        headerTintColor: colors.surface,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Control Panel' }} />
      <Stack.Screen name="EmergencyReview" component={AdminEmergencyReviewScreen} options={{ title: 'Emergency Reviews' }} />
    </Stack.Navigator>
  );
};
