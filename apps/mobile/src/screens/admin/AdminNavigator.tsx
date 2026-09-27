import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminDashboardScreen } from './AdminDashboardScreen';
import { AdminEmergencyReviewScreen } from './AdminEmergencyReviewScreen';
import { AdminUsersScreen } from './AdminUsersScreen';
import { AdminRequestsScreen } from './AdminRequestsScreen';
import { AdminDonationsScreen } from './AdminDonationsScreen';
import { AdminCampaignsScreen } from './AdminCampaignsScreen';
import { AdminPaymentsScreen } from './AdminPaymentsScreen';
import { AdminBroadcastScreen } from './AdminBroadcastScreen';
import { AdminSettingsScreen } from './AdminSettingsScreen';
import { AdminAuditScreen } from './AdminAuditScreen';
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
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EmergencyReview" component={AdminEmergencyReviewScreen} options={{ title: 'Emergency Reviews' }} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: 'Users & Donors' }} />
      <Stack.Screen name="AdminRequests" component={AdminRequestsScreen} options={{ title: 'Blood Requests' }} />
      <Stack.Screen name="AdminDonations" component={AdminDonationsScreen} options={{ title: 'Verify Donations' }} />
      <Stack.Screen name="AdminCampaigns" component={AdminCampaignsScreen} options={{ title: 'Campaigns & Drives' }} />
      <Stack.Screen name="AdminPayments" component={AdminPaymentsScreen} options={{ title: 'Financials & Revenue' }} />
      <Stack.Screen name="AdminBroadcast" component={AdminBroadcastScreen} options={{ title: 'Donor Broadcasts' }} />
      <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} options={{ title: 'System Settings' }} />
      <Stack.Screen name="AdminAudit" component={AdminAuditScreen} options={{ title: 'Security Audit Log' }} />
    </Stack.Navigator>
  );
};
