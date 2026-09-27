import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CampaignsScreen } from './CampaignsScreen';
import { CampaignDetailScreen } from './CampaignDetailScreen';
import { colors } from '../../theme';

const Stack = createNativeStackNavigator();

export const CampaignsNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CampaignsList" component={CampaignsScreen} />
      <Stack.Screen name="CampaignDetail" component={CampaignDetailScreen} />
    </Stack.Navigator>
  );
};
