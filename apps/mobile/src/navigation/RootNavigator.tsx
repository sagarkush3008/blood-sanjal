import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { AuthNavigator } from './AuthNavigator';
import { MainTabs } from './MainTabs';
import { ProfileNavigator } from '../screens/profile/ProfileNavigator';
import { AdminNavigator } from '../screens/admin/AdminNavigator';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { CreateRequestScreen } from '../screens/requests/CreateRequestScreen';
import { RequestDetailScreen } from '../screens/requests/RequestDetailScreen';
import { CampaignDetailScreen } from '../screens/campaigns/CampaignDetailScreen';
import { TermsScreen } from '../screens/settings/TermsScreen';
import { PrivacyPolicyScreen } from '../screens/settings/PrivacyPolicyScreen';
import { PaymentScreen } from '../screens/payments/PaymentScreen';
import { PaymentHistoryScreen } from '../screens/payments/PaymentHistoryScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();

const AppNavigator = ({ role }: { role?: string }) => {
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={isAdmin ? 'Admin' : 'MainTabs'}>
      {isAdmin ? (
        // Admin-only main flow
        <Stack.Screen name="Admin" component={AdminNavigator} />
      ) : (
        // Regular user main flow
        <Stack.Screen name="MainTabs" component={MainTabs} />
      )}
      {/* Shared Screens for Modals or Deep Linking */}
      {!isAdmin && <Stack.Screen name="Admin" component={AdminNavigator} />}
      {!isAdmin && <Stack.Screen name="MainTabs" component={MainTabs} />}
      <Stack.Screen name="Profile" component={ProfileNavigator} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: true, title: 'Notifications' }} />
      <Stack.Screen name="CreateRequest" component={CreateRequestScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CampaignDetail" component={CampaignDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CampaignDetails" component={CampaignDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Terms" component={TermsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export const RootNavigator = () => {
  const { token, user, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? <AppNavigator role={user?.role} /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
