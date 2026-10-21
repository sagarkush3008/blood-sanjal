import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Platform, Text, TextInput, LogBox } from 'react-native';

LogBox.ignoreAllLogs(true);
LogBox.ignoreLogs([
  /Cannot connect to Expo CLI/,
  /The action 'NAVIGATE' with payload/,
  /Sending `onAnimatedValueUpdate`/,
]);
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';
import './src/i18n';

// Globally set Inter as default font for all React Native Text & TextInput
const defaultFont = Platform.select({
  web: "'Inter', sans-serif",
  default: 'Inter_400Regular',
});

// @ts-ignore
if (Text.defaultProps == null) {
  // @ts-ignore
  Text.defaultProps = {};
}
// @ts-ignore
Text.defaultProps.style = [{ fontFamily: defaultFont }, Text.defaultProps.style];

// @ts-ignore
if (TextInput.defaultProps == null) {
  // @ts-ignore
  TextInput.defaultProps = {};
}
// @ts-ignore
TextInput.defaultProps.style = [{ fontFamily: defaultFont }, TextInput.defaultProps.style];

import { queryClient } from './src/api/queryClient';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  // Inject Google Fonts Inter stylesheet and global font-family rule in Web environment
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const linkId = 'google-font-inter';
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap';
        document.head.appendChild(link);
      }

      const styleId = 'inter-global-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          @font-face {
            font-family: 'Feather';
            src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.0.2/build/vendor/react-native-vector-icons/Fonts/Feather.ttf') format('truetype');
          }
          @font-face {
            font-family: 'Ionicons';
            src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.0.2/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype');
          }
          @font-face {
            font-family: 'MaterialCommunityIcons';
            src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.0.2/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf') format('truetype');
          }
          @font-face {
            font-family: 'MaterialIcons';
            src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.0.2/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf') format('truetype');
          }
          html, body, #root {
            font-family: 'Inter', sans-serif;
          }
          input, textarea, select, button {
            font-family: 'Inter', sans-serif;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  if (!fontsLoaded && Platform.OS !== 'web') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.background }}>
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
        <StatusBar style="auto" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
