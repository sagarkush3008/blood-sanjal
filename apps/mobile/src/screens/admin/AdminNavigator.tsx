import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminDashboardScreen } from './AdminDashboardScreen';
import { AdminEmergencyReviewScreen } from './AdminEmergencyReviewScreen';
import { AdminUsersScreen } from './AdminUsersScreen';
import { AdminSettingsScreen } from './AdminSettingsScreen';
import { AdminAuditScreen } from './AdminAuditScreen';
import { AdminDonationsScreen } from './AdminDonationsScreen';
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
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: 'User & Donor Management' }} />
      <Stack.Screen name="AdminDonations" component={AdminDonationsScreen} options={{ title: 'Verify Donations' }} />
      <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} options={{ title: 'System Settings' }} />
      <Stack.Screen name="AdminAudit" component={AdminAuditScreen} options={{ title: 'Audit Logs' }} />
    </Stack.Navigator>
  );
};
