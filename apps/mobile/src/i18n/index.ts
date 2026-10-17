import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ne from './locales/ne.json';

export const defaultNS = 'common';
export const resources = {
  en: {
    common: en.common,
  },
  ne: {
    common: ne.common,
  },
} as const;

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4', // Crucial for React Native Android/iOS compatibility
    resources,
    defaultNS: 'common',
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
