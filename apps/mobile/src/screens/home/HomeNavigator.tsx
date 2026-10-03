import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './HomeScreen';
import { NotificationsScreen } from '../notifications/NotificationsScreen';
import { CampaignsScreen } from '../campaigns/CampaignsScreen';
import { CampaignDetailScreen } from '../campaigns/CampaignDetailScreen';
import { ContactRequestsScreen } from '../contactRequests/ContactRequestsScreen';
import { CreateRequestScreen } from '../requests/CreateRequestScreen';
import { RequestDetailScreen } from '../requests/RequestDetailScreen';
import { ProfileNavigator } from '../profile/ProfileNavigator';
import { FindBloodNavigator } from '../findBlood/FindBloodNavigator';
import { RewardsScreen } from '../profile/RewardsScreen';
import { colors } from '../../theme';

const Stack = createNativeStackNavigator();

export const HomeNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontFamily: 'Inter_700Bold' },
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="FindBlood" component={FindBloodNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Campaigns" component={CampaignsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CampaignDetail" component={CampaignDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CampaignDetails" component={CampaignDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ContactRequests" component={ContactRequestsScreen} options={{ title: 'Contact Requests' }} />
      <Stack.Screen name="CreateRequest" component={CreateRequestScreen} options={{ title: 'Create Blood Request' }} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ title: 'Request Details' }} />
      <Stack.Screen name="Rewards" component={RewardsScreen} options={{ title: 'Milestones & Badges' }} />
      <Stack.Screen name="Profile" component={ProfileNavigator} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};
