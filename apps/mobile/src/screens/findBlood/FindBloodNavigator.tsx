import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FindBloodScreen } from './FindBloodScreen';
import { ContactRequestsScreen } from '../contactRequests/ContactRequestsScreen';
import { CreateRequestScreen } from '../requests/CreateRequestScreen';
import { colors } from '../../theme';

const Stack = createNativeStackNavigator();

export const FindBloodNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontFamily: 'Inter_700Bold' },
      }}
    >
      <Stack.Screen
        name="FindBloodMain"
        component={FindBloodScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ContactRequests"
        component={ContactRequestsScreen}
        options={{ title: 'Contact Requests' }}
      />
      <Stack.Screen
        name="CreateRequest"
        component={CreateRequestScreen}
        options={{ title: 'Request Blood' }}
      />
    </Stack.Navigator>
  );
};
