import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './HomeScreen';
import { NotificationsScreen } from '../notifications/NotificationsScreen';
import { CampaignsScreen } from './CampaignsScreen';
import { CampaignDetailsScreen } from './CampaignDetailsScreen';
import { ProfileNavigator } from '../profile/ProfileNavigator';
import { colors } from '../../theme';

const Stack = createNativeStackNavigator();

export const HomeNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#DC2626',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Campaigns" component={CampaignsScreen} options={{ title: 'Blood Donation Drives' }} />
      <Stack.Screen name="CampaignDetails" component={CampaignDetailsScreen} options={{ title: 'Camp Details' }} />
      <Stack.Screen name="Profile" component={ProfileNavigator} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

