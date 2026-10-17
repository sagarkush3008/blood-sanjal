import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

interface LanguageToggleProps {
  /** Optional custom container style overrides without breaking local encapsulation */
  style?: object;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ style }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('ne') ? 'ne' : 'en';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'ne' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <TouchableOpacity
      style={[styles.pillContainer, style]}
      onPress={toggleLanguage}
      activeOpacity={0.8}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel={`Current language is ${currentLang === 'en' ? 'English' : 'Nepali'}. Tap to switch.`}
    >
      <View style={styles.globeBox}>
        <Ionicons name="globe-outline" size={14} color="#64748B" />
      </View>

      <View style={styles.toggleTrack}>
        <View style={[styles.langOption, currentLang === 'en' && styles.langOptionActive]}>
          <Text style={[styles.langText, currentLang === 'en' && styles.langTextActive]}>
            EN
          </Text>
        </View>

        <View style={[styles.langOption, currentLang === 'ne' && styles.langOptionActive]}>
          <Text style={[styles.langText, currentLang === 'ne' && styles.langTextActive]}>
            नेपाली
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'flex-start',
  },
  globeBox: {
    paddingLeft: 4,
    paddingRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
    borderRadius: 14,
    padding: 2,
  },
  langOption: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  langText: {
    fontSize: 10.5,
    fontFamily: 'Inter_500Medium',
    color: '#64748B',
  },
  langTextActive: {
    fontFamily: 'Inter_700Bold',
    color: '#DC2626',
  },
});
