import { Platform } from 'react-native';

export const fonts = {
  light: Platform.select({
    web: "'Poppins', sans-serif",
    default: 'Poppins_300Light',
  }),
  regular: Platform.select({
    web: "'Poppins', sans-serif",
    default: 'Poppins_400Regular',
  }),
  medium: Platform.select({
    web: "'Poppins', sans-serif",
    default: 'Poppins_500Medium',
  }),
  semiBold: Platform.select({
    web: "'Poppins', sans-serif",
    default: 'Poppins_600SemiBold',
  }),
  bold: Platform.select({
    web: "'Poppins', sans-serif",
    default: 'Poppins_700Bold',
  }),
  extraBold: Platform.select({
    web: "'Poppins', sans-serif",
    default: 'Poppins_800ExtraBold',
  }),
  black: Platform.select({
    web: "'Poppins', sans-serif",
    default: 'Poppins_900Black',
  }),
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, fontFamily: fonts.bold },
  h2: { fontSize: 24, fontWeight: '700' as const, fontFamily: fonts.bold },
  h3: { fontSize: 20, fontWeight: '600' as const, fontFamily: fonts.semiBold },
  body1: { fontSize: 16, fontWeight: '400' as const, fontFamily: fonts.regular },
  body2: { fontSize: 14, fontWeight: '400' as const, fontFamily: fonts.regular },
  caption: { fontSize: 12, fontWeight: '400' as const, fontFamily: fonts.regular },
  button: { fontSize: 16, fontWeight: '600' as const, fontFamily: fonts.semiBold },
};
