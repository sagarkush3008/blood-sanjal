import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen, FindBloodScreen, RequestsScreen, DonateScreen, ProfileScreen } from '../screens/MainScreens';

const Tab = createBottomTabNavigator();

export const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#B91C1C',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: '#FFF1F2',
          borderTopWidth: 1,
          borderTopColor: '#FFE4E6',
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#0F172A',
        headerTitleStyle: { fontWeight: '800' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activePill]}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={20} color={focused ? '#B91C1C' : color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Find Blood"
        component={FindBloodScreen}
        options={{
          tabBarLabel: 'Find Blood',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activePill]}>
              <Ionicons name="search" size={20} color={focused ? '#B91C1C' : color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Requests"
        component={RequestsScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Emergency Blood',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activePill]}>
              <Ionicons name="notifications" size={21} color="#DC2626" />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Donate"
        component={DonateScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Donate',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activePill]}>
              <Ionicons name={focused ? 'heart' : 'heart-outline'} size={20} color={focused ? '#B91C1C' : color} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Banks',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activePill]}>
              <Ionicons name={focused ? 'medkit' : 'medkit-outline'} size={20} color={focused ? '#B91C1C' : color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 14,
  },
  activePill: {
    backgroundColor: '#FEE2E2',
  },
});
