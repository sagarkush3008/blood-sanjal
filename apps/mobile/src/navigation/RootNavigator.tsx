import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

const Stack = createNativeStackNavigator();

// Temporary Placeholder Screen
const PlaceholderScreen = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>Blood Sanjal Mobile App</Text>
  </View>
);

export const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="HomePlaceholder" component={PlaceholderScreen} options={{ title: 'Blood Sanjal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
