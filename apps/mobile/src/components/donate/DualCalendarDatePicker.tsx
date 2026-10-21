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

// Brand & Minimal Semantic Palette
const BRAND_RED = '#E63946';
const SLATE_900 = '#0F172A';
const SLATE_600 = '#475569';
const SLATE_400 = '#94A3B8';
const SLATE_100 = '#F1F5F9';
const SLATE_50 = '#F8FAFC';
const BORDER_COLOR = '#E2E8F0';

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
    // Check if ISO or slash formatted
    const parsedAd = parseADStringToDate(val);
    if (parsedAd) return parsedAd;
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const [currentAdDate, setCurrentAdDate] = useState<Date>(getAuthoritativeDate(value));

  // 3. Visual Text State (Formatted according to current calendarMode)
  const getDisplayValue = (date: Date, mode: CalendarSystem): string => {
    if (mode === 'BS') {
      return formatBSDisplay(date, 'verbose');
    }
    return formatADDisplay(date, 'MM/DD/YYYY');
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
    // Smoothly reformat the visual text without altering the underlying Gregorian date
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
    // If input is invalid or incomplete on blur, restore clean formatted representation
    setDisplayInput(getDisplayValue(currentAdDate, calendarMode));
  };

  return (
    <View style={styles.container}>
      {/* 1. Label and Dual Calendar Pill Toggle Header */}
      <View style={styles.headerRow}>
        <View style={styles.labelGroup}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <View
            style={[
              styles.modeBadge,
              calendarMode === 'BS' ? styles.modeBadgeBs : styles.modeBadgeAd,
            ]}
          >
            <Text
              style={[
                styles.modeBadgeText,
                calendarMode === 'BS' ? styles.modeBadgeTextBs : styles.modeBadgeTextAd,
              ]}
            >
              {calendarMode === 'BS' ? 'Bikram Sambat' : 'Gregorian'}
            </Text>
          </View>
        </View>

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

      {/* 2. Interactive Input Field */}
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
          <Ionicons name="calendar-outline" size={18} color={BRAND_RED} />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          value={displayInput}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          placeholder={calendarMode === 'AD' ? 'mm/dd/yyyy' : 'YYYY/MM/DD (e.g. 2083/07/04)'}
          placeholderTextColor={SLATE_400}
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
          <Ionicons name="calendar" size={18} color={BRAND_RED} />
        </TouchableOpacity>
      </View>

      {/* 3. Subtext Guidance & Validation Pill */}
      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : (
        <View style={styles.helperRow}>
          <Ionicons
            name="checkmark-circle-outline"
            size={12}
            color="#059669"
            style={{ marginRight: 4 }}
          />
          <Text style={styles.helperText}>
            {calendarMode === 'BS'
              ? 'Nepali Bikram Sambat (नेपाली पात्रो) • Stored in standard AD'
              : 'Gregorian Calendar (AD) • Standard ISO format'}
          </Text>
        </View>
      )}

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
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: SLATE_900,
    marginRight: 6,
  },
  modeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modeBadgeAd: {
    backgroundColor: '#EFF6FF',
  },
  modeBadgeBs: {
    backgroundColor: '#FEF2F2',
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modeBadgeTextAd: {
    color: '#2563EB',
  },
  modeBadgeTextBs: {
    color: BRAND_RED,
  },
  segmentedToggleContainer: {
    flexDirection: 'row',
    backgroundColor: SLATE_100,
    borderRadius: 14,
    padding: 2,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  togglePill: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  togglePillActive: {
    backgroundColor: BRAND_RED,
  },
  togglePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: SLATE_600,
  },
  togglePillTextActive: {
    color: '#FFFFFF',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SLATE_50,
    borderWidth: 1.5,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
  },
  inputWrapperDisabled: {
    backgroundColor: '#F1F5F9',
    opacity: 0.7,
  },
  leadIconBtn: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: SLATE_900,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },
  calendarActionBtn: {
    padding: 4,
    marginLeft: 6,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    paddingHorizontal: 2,
  },
  helperText: {
    fontSize: 11,
    fontWeight: '500',
    color: SLATE_600,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 4,
    paddingHorizontal: 2,
  },
});
