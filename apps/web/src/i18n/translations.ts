export type Language = 'en' | 'ne';
export interface Translations {
  [key: string]: string;
}
export const TRANSLATIONS: Record<Language, Translations> = {
  en: { appName: 'Blood Sanjal' },
  ne: { appName: 'Blood Sanjal (NE)' }
};
