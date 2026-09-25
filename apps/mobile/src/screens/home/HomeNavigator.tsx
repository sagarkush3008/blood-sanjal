import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './HomeScreen';
import { NotificationsScreen } from '../notifications/NotificationsScreen';
import { CampaignsScreen } from './CampaignsScreen';
import { CampaignDetailsScreen } from './CampaignDetailsScreen';
import { colors } from '../../theme';

const Stack = createNativeStackNavigator();

export const HomeNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Campaigns" component={CampaignsScreen} options={{ title: 'Blood Camps' }} />
      <Stack.Screen name="CampaignDetails" component={CampaignDetailsScreen} options={{ title: 'Camp Details' }} />
    </Stack.Navigator>
  );
};
