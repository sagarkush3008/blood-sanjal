import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  formatADDisplay,
  formatBSDisplay,
  parseADStringToDate,
  parseBSStringToDate,
} from '../../utils/nepaliDate.utils';
import { CalendarPickerModal, CalendarSystem } from '../common/CalendarPickerModal';
import { fonts } from '../../theme';

export interface DualCalendarDatePickerProps {
  /**
   * The authoritative date, ALWAYS stored in Gregorian AD format (ISO string or Date).
   * e.g., '2026-10-21T00:00:00.000Z' or new Date()
   */
  value: Date | string;

  /**
   * Callback fired whenever the user changes the date.
   * Emits the canonical Gregorian AD Date object and its ISO-8601 string.
   */
  onChange: (adDate: Date, isoString: string) => void;

  /**
   * Label above the picker. Defaults to 'Donation Date *'
   */
  label?: string;

  /**
   * Maximum allowed date (defaults to today to prevent recording future donations)
   */
  maxDate?: Date;

  /**
   * Optional initial calendar mode ('AD' or 'BS'). Defaults to 'AD'
   */
  defaultMode?: CalendarSystem;

  /**
   * Error message to display beneath the field
   */
  errorMessage?: string;

  /**
   * Disabled state
   */
  disabled?: boolean;
}

// Brand Red strictly for focus / active states; neutrals for flat, airy canvas
const BRAND_RED = '#E63946';

export const DualCalendarDatePicker: React.FC<DualCalendarDatePickerProps> = ({
  value,
  onChange,
  label = 'Donation Date *',
  maxDate = new Date(),
  defaultMode = 'AD',
  errorMessage,
  disabled = false,
}) => {
  // 1. Calendar System Toggle State ('AD' vs 'BS')
  const [calendarMode, setCalendarMode] = useState<CalendarSystem>(defaultMode);

  // 2. Authoritative Gregorian Date parser
  const getAuthoritativeDate = (val: Date | string): Date => {
    if (!val) return new Date();
    if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
    const parsedAd = parseADStringToDate(val);
    if (parsedAd) return parsedAd;
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const [currentAdDate, setCurrentAdDate] = useState<Date>(getAuthoritativeDate(value));

  // 3. Pure Numeric Format (e.g. 2026-10-21 for AD, 2083-07-04 for BS)
  const getDisplayValue = (date: Date, mode: CalendarSystem): string => {
    if (mode === 'BS') {
      return formatBSDisplay(date, 'numeric');
    }
    return formatADDisplay(date, 'YYYY-MM-DD');
  };

  const [displayInput, setDisplayInput] = useState<string>(
    getDisplayValue(getAuthoritativeDate(value), defaultMode)
  );

  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  // Synchronize when external value prop changes
  useEffect(() => {
    const parsed = getAuthoritativeDate(value);
    setCurrentAdDate(parsed);
    setDisplayInput(getDisplayValue(parsed, calendarMode));
  }, [value]);

  // Handle switching between AD and BS modes
  const handleToggleMode = (newMode: CalendarSystem) => {
    if (newMode === calendarMode) return;
    setCalendarMode(newMode);
    // Smoothly reformat the visual text to pure numeric without altering the underlying Gregorian date
    setDisplayInput(getDisplayValue(currentAdDate, newMode));
  };

  // Date selection callback from visual Calendar Modal
  const handleSelectFromCalendar = (formattedString: string, standardDate: Date) => {
    setCurrentAdDate(standardDate);
    setDisplayInput(getDisplayValue(standardDate, calendarMode));
    // Emit authoritative Gregorian AD date and ISO string to parent form
    onChange(standardDate, standardDate.toISOString());
  };

  // Handle manual typing in input
  const handleTextChange = (text: string) => {
    setDisplayInput(text);

    if (calendarMode === 'AD') {
      const parsed = parseADStringToDate(text);
      if (parsed) {
        setCurrentAdDate(parsed);
        onChange(parsed, parsed.toISOString());
      }
    } else {
      const parsed = parseBSStringToDate(text);
      if (parsed) {
        setCurrentAdDate(parsed);
        onChange(parsed, parsed.toISOString());
      }
    }
  };

  const handleBlur = () => {
    // If input is invalid or incomplete on blur, restore clean numeric representation
    setDisplayInput(getDisplayValue(currentAdDate, calendarMode));
  };

  return (
    <View style={styles.container}>
      {/* 1. Clean Label and Minimal Segmented Pill Toggle */}
      <View style={styles.headerRow}>
        <Text style={styles.fieldLabel}>{label}</Text>

        {/* Minimalist Segmented Pill Toggle Switch */}
        <View style={styles.segmentedToggleContainer}>
          <TouchableOpacity
            style={[
              styles.togglePill,
              calendarMode === 'AD' && styles.togglePillActive,
            ]}
            onPress={() => handleToggleMode('AD')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Switch to AD Gregorian Calendar"
          >
            <Text
              style={[
                styles.togglePillText,
                calendarMode === 'AD' && styles.togglePillTextActive,
              ]}
            >
              AD
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.togglePill,
              calendarMode === 'BS' && styles.togglePillActive,
            ]}
            onPress={() => handleToggleMode('BS')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Switch to BS Bikram Sambat Nepali Calendar"
          >
            <Text
              style={[
                styles.togglePillText,
                calendarMode === 'BS' && styles.togglePillTextActive,
              ]}
            >
              BS
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Flat & Airy Numeric Input Field */}
      <View
        style={[
          styles.inputWrapper,
          errorMessage ? styles.inputWrapperError : null,
          disabled ? styles.inputWrapperDisabled : null,
        ]}
      >
        <TouchableOpacity
          onPress={() => !disabled && setIsCalendarOpen(true)}
          activeOpacity={0.7}
          style={styles.leadIconBtn}
          accessibilityLabel="Open calendar"
        >
          <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          value={displayInput}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9CA3AF"
          editable={!disabled}
          accessibilityLabel={`${label} ${calendarMode} input`}
        />

        <TouchableOpacity
          style={styles.calendarActionBtn}
          onPress={() => !disabled && setIsCalendarOpen(true)}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Choose date from calendar modal"
        >
          <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* 3. Error message if validation fails */}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {/* 4. Unified AD/BS Interactive Calendar Picker Modal */}
      <CalendarPickerModal
        visible={isCalendarOpen}
        selectedDate={currentAdDate}
        calendarSystem={calendarMode}
        onToggleCalendarSystem={setCalendarMode}
        onClose={() => setIsCalendarOpen(false)}
        onSelectDate={handleSelectFromCalendar}
        maxDate={maxDate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 28, // Massive whitespace between form sections
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#374151',
  },
  segmentedToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 2.5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  togglePill: {
    paddingVertical: 3.5,
    paddingHorizontal: 11,
    borderRadius: 11,
  },
  togglePillActive: {
    backgroundColor: BRAND_RED,
  },
  togglePillText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: '#6B7280',
  },
  togglePillTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.semiBold,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB', // Flat, subtle light gray
    borderWidth: 1,
    borderColor: '#E5E7EB', // Faint 1px border
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52, // Slightly taller for modern breathing room
  },
  inputWrapperError: {
    borderColor: '#EF4444',
  },
  inputWrapperDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  leadIconBtn: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#111827',
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  calendarActionBtn: {
    padding: 4,
    marginLeft: 6,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: '#EF4444',
    marginTop: 6,
    paddingHorizontal: 2,
  },
});
