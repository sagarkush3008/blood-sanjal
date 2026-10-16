import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  HomeScreen,
  FindBloodScreen,
  RequestsScreen,
  DonateScreen,
} from '../screens/MainScreens';
import { FloatingPillTabBar } from '../components/navigation/FloatingPillTabBar';

const Tab = createBottomTabNavigator();

export const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingPillTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="FindBlood" component={FindBloodScreen} />
      <Tab.Screen name="Donate" component={DonateScreen} />
      <Tab.Screen name="Requests" component={RequestsScreen} />
    </Tab.Navigator>
  );
};
