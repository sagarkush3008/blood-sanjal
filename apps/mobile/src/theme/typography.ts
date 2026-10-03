import { Platform } from 'react-native';

export const fonts = {
  light: Platform.select({
    web: "'Inter', sans-serif",
    default: 'Inter_300Light',
  }),
  regular: Platform.select({
    web: "'Inter', sans-serif",
    default: 'Inter_400Regular',
  }),
  medium: Platform.select({
    web: "'Inter', sans-serif",
    default: 'Inter_500Medium',
  }),
  semiBold: Platform.select({
    web: "'Inter', sans-serif",
    default: 'Inter_600SemiBold',
  }),
  bold: Platform.select({
    web: "'Inter', sans-serif",
    default: 'Inter_700Bold',
  }),
  extraBold: Platform.select({
    web: "'Inter', sans-serif",
    default: 'Inter_800ExtraBold',
  }),
  black: Platform.select({
    web: "'Inter', sans-serif",
    default: 'Inter_900Black',
  }),
};

export const typography = {
  h1: { fontSize: 32, fontFamily: 'Inter_700Bold' as const },
  h2: { fontSize: 24, fontFamily: 'Inter_700Bold' as const },
  h3: { fontSize: 20, fontFamily: 'Inter_600SemiBold' as const },
  body1: { fontSize: 16, fontFamily: 'Inter_400Regular' as const },
  body2: { fontSize: 14, fontFamily: 'Inter_400Regular' as const },
  subtitle1: { fontSize: 16, fontFamily: 'Inter_500Medium' as const },
  subtitle2: { fontSize: 14, fontFamily: 'Inter_500Medium' as const },
  caption: { fontSize: 12, fontFamily: 'Inter_400Regular' as const },
  button: { fontSize: 16, fontFamily: 'Inter_600SemiBold' as const },
};
