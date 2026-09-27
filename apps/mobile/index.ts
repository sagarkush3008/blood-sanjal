import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';
import App from './App';

// Completely disable yellow warning popups on device screen
LogBox.ignoreAllLogs(true);

// Filter annoying harmless Expo CLI connection warning
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Cannot connect to Expo CLI') || args[0].includes('NAVIGATE'))
  ) {
    return;
  }
  originalWarn(...args);
};

// Suppress harmless Expo development server warnings
LogBox.ignoreLogs([
  /Cannot connect to Expo CLI/,
  /The action 'NAVIGATE' with payload/,
  /Sending `onAnimatedValueUpdate`/,
]);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
