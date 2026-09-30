import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { MainTabs } from './MainTabs';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { AboutScreen } from '../screens/settings/AboutScreen';
import { TermsScreen } from '../screens/settings/TermsScreen';
import { PrivacyPolicyScreen } from '../screens/settings/PrivacyPolicyScreen';
import { Ionicons, Feather } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props: any) => {
  const { user, logout } = useAuthStore();
  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
      </View>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Logout"
        icon={({ color, size }) => <Feather name="log-out" size={size} color={color} />}
        onPress={() => {
          logout();
        }}
      />
    </DrawerContentScrollView>
  );
};

export const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: '#DC2626',
        drawerInactiveTintColor: '#334155',
        drawerLabelStyle: {
          fontFamily: 'Poppins_500Medium',
          fontSize: 15,
        },
      }}
    >
      <Drawer.Screen 
        name="HomeTabs" 
        component={MainTabs} 
        options={{ 
          drawerLabel: 'Home',
          drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />
        }} 
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ 
          headerShown: true,
          drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />
        }} 
      />
      <Drawer.Screen 
        name="About Us" 
        component={AboutScreen} 
        options={{ 
          headerShown: true,
          drawerIcon: ({ color, size }) => <Ionicons name="information-circle-outline" size={size} color={color} />
        }} 
      />
      <Drawer.Screen 
        name="Terms" 
        component={TermsScreen} 
        options={{ 
          headerShown: true,
          drawerIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />
        }} 
      />
      <Drawer.Screen 
        name="Privacy Policy" 
        component={PrivacyPolicyScreen} 
        options={{ 
          headerShown: true,
          drawerIcon: ({ color, size }) => <Ionicons name="shield-checkmark-outline" size={size} color={color} />
        }} 
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#64748B',
  },
});
