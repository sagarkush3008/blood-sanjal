import 'react-native';

declare module 'react-native' {
  interface StatusBarProps {
    backgroundColor?: string;
  }
  interface RefreshControlProps {
    onRefresh?: () => any;
  }
}
