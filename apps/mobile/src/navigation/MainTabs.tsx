import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, Feather } from '@expo/vector-icons';
import { colors } from '../theme';
import {
  HomeScreen,
  FindBloodScreen,
  RequestsScreen,
  DonateScreen,
  ProfileScreen,
} from '../screens/MainScreens';

const Tab = createBottomTabNavigator();

export const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#DC2626', // Red color for active tabs
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="FindBlood"
        component={FindBloodScreen}
        options={{
          tabBarLabel: 'Find Blood',
          tabBarIcon: ({ color, focused }) => (
            <Feather name="search" size={24} color={color} />
          ),
        }}
      />

      {/* CUSTOM DONATE FAB */}
      <Tab.Screen
        name="Donate"
        component={DonateScreen}
        options={{
          tabBarLabel: 'DONATE',
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '900',
            color: '#DC2626',
            marginTop: 4,
          },
          tabBarIcon: () => (
            <View style={styles.fabContainer}>
              <View style={styles.fab}>
                <Ionicons name="water" size={28} color="#FFFFFF" />
              </View>
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Requests"
        component={RequestsScreen}
        options={{
          tabBarLabel: 'Requests',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} size={24} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Feather name="user" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    marginTop: -32, // Pulls the icon up outside the normal flow
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
});
