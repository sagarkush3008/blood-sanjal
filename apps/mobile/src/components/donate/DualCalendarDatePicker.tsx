import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
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
   * External error message to display beneath the field
   */
  errorMessage?: string;

  /**
   * Disabled state
   */
  disabled?: boolean;
}

// Brand Red strictly for focus / active states & CTAs
const BRAND_RED = '#DC2626';
const ERROR_RED = '#EF4444';

/**
 * Smart date mask that enforces YYYY-MM-DD with auto-hyphen insertion
 * and smart logical restrictions (Month <= 12, Day <= 31).
 */
function applySmartDateMask(text: string, prevText: string): string {
  // If user is deleting/backspacing
  const isDeleting = text.length < prevText.length;
  if (isDeleting) {
    // If user deleted a hyphen (e.g. was "2026-10-", now "2026-10")
    if (prevText.endsWith('-') && text === prevText.slice(0, -1)) {
      return text.slice(0, -1); // also remove the digit preceding the hyphen
    }
    return text;
  }

  // Extract only numbers, max 8 digits for YYYYMMDD
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (!digits) return '';

  // 1-4 digits: Year
  if (digits.length <= 4) {
    return digits;
  }

  const year = digits.slice(0, 4);
  let monthPart = digits.slice(4);

  // Smart Month restrictions: Month cannot exceed 12
  if (monthPart.length === 1) {
    // If single digit is 2..9, auto-pad with leading 0 (e.g. 5 -> 05)
    if (parseInt(monthPart, 10) > 1) {
      monthPart = '0' + monthPart;
    }
  } else if (monthPart.length >= 2) {
    let mNum = parseInt(monthPart.slice(0, 2), 10);
    if (mNum > 12) mNum = 12;
    if (mNum === 0) mNum = 1;
    monthPart = String(mNum).padStart(2, '0') + monthPart.slice(2);
  }

  // 5-6 digits: Year-Month
  if (monthPart.length <= 2) {
    return `${year}-${monthPart}`;
  }

  const month = monthPart.slice(0, 2);
  let dayPart = monthPart.slice(2, 4);

  // Smart Day restrictions: Day cannot exceed 31
  if (dayPart.length === 1) {
    // If single digit is 4..9, auto-pad with leading 0 (e.g. 8 -> 08)
    if (parseInt(dayPart, 10) > 3) {
      dayPart = '0' + dayPart;
    }
  } else if (dayPart.length === 2) {
    let dNum = parseInt(dayPart, 10);
    if (dNum > 31) dNum = 31;
    if (dNum === 0) dNum = 1;
    dayPart = String(dNum).padStart(2, '0');
  }

  return `${year}-${month}-${dayPart}`;
}

export const DualCalendarDatePicker: React.FC<DualCalendarDatePickerProps> = ({
  value,
  onChange,
  label = 'Donation Date *',
  maxDate = new Date(),
  defaultMode = 'AD',
  errorMessage,
  disabled = false,
}) => {
  // Calendar System Toggle ('AD' vs 'BS')
  const [calendarMode, setCalendarMode] = useState<CalendarSystem>(defaultMode);

  // Authoritative Gregorian Date parser
  const getAuthoritativeDate = (val: Date | string): Date => {
    if (!val) return new Date();
    if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
    const parsedAd = parseADStringToDate(val);
    if (parsedAd) return parsedAd;
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const [currentAdDate, setCurrentAdDate] = useState<Date>(getAuthoritativeDate(value));

  // Numeric Format: YYYY-MM-DD
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
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Animated Values for Smooth Focus & Error Transitions
  const focusAnim = useRef(new Animated.Value(0)).current;
  const errorAnim = useRef(new Animated.Value(0)).current;

  const inputRef = useRef<any>(null);

  // Synchronize when external value prop changes
  useEffect(() => {
    const parsed = getAuthoritativeDate(value);
    setCurrentAdDate(parsed);
    setDisplayInput(getDisplayValue(parsed, calendarMode));
    setLocalError(null);
  }, [value]);

  // Smooth Focus Animation (Border color, background glow)
  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  // Smooth Error Banner Animation
  const activeError = errorMessage || localError;
  useEffect(() => {
    Animated.timing(errorAnim, {
      toValue: activeError ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [activeError]);

  // Handle switching between AD and BS modes
  const handleToggleMode = (newMode: CalendarSystem) => {
    if (newMode === calendarMode) return;
    setCalendarMode(newMode);
    setLocalError(null);
    setDisplayInput(getDisplayValue(currentAdDate, newMode));
  };

  // Date selection callback from visual Calendar Modal
  const handleSelectFromCalendar = (_formattedString: string, standardDate: Date) => {
    setCurrentAdDate(standardDate);
    setDisplayInput(getDisplayValue(standardDate, calendarMode));
    setLocalError(null);
    onChange(standardDate, standardDate.toISOString());
  };

  // Validate date logic (especially future date prevention)
  const validateAndEmitDate = (dateStr: string) => {
    if (dateStr.length < 10) return;

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (calendarMode === 'AD') {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const parsed = new Date(y, m, d);

        if (isNaN(parsed.getTime()) || parsed.getMonth() !== m || parsed.getDate() !== d) {
          setLocalError('Please enter a valid calendar date.');
          return;
        }

        if (parsed.getTime() > todayEnd.getTime()) {
          setLocalError('Donation date cannot be in the future.');
          return;
        }

        if (y < 1920) {
          setLocalError('Please enter a valid donation year.');
          return;
        }

        setLocalError(null);
        setCurrentAdDate(parsed);
        onChange(parsed, parsed.toISOString());
      }
    } else {
      // BS Mode
      const parsed = parseBSStringToDate(dateStr);
      if (!parsed || isNaN(parsed.getTime())) {
        setLocalError('Please enter a valid BS calendar date.');
        return;
      }

      if (parsed.getTime() > todayEnd.getTime()) {
        setLocalError('Donation date cannot be in the future.');
        return;
      }

      setLocalError(null);
      setCurrentAdDate(parsed);
      onChange(parsed, parsed.toISOString());
    }
  };

  // Handle manual typing in input with smart masking
  const handleTextChange = (text: string) => {
    const masked = applySmartDateMask(text, displayInput);
    setDisplayInput(masked);

    // If user is actively typing/editing, clear error until complete
    if (localError && masked.length < 10) {
      setLocalError(null);
    }

    if (masked.length === 10) {
      validateAndEmitDate(masked);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (displayInput.length > 0 && displayInput.length < 10) {
      setLocalError('Please enter a complete date (YYYY-MM-DD).');
    } else if (!localError) {
      // Restore clean formatting
      setDisplayInput(getDisplayValue(currentAdDate, calendarMode));
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  // Animated Interpolations for Ultra-Premium Polish
  const animatedBorderColor = activeError
    ? ERROR_RED
    : focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#E5E7EB', BRAND_RED],
      });

  const animatedBackgroundColor = activeError
    ? '#FEF2F2'
    : focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#F9FAFB', '#FFFFFF'],
      });

  const animatedShadowOpacity = activeError
    ? 0.1
    : focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.08],
      });

  return (
    <View style={styles.container}>
      {/* 1. Crisp Label and Minimalist Segmented Pill Toggle */}
      <View style={styles.headerRow}>
        <Text style={styles.fieldLabel}>{label}</Text>

        {/* Minimalist Segmented Pill Toggle Switch (AD / BS) */}
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

      {/* 2. Ultra-Minimal, Animated Input Box (56px, 12px Radius, Stripe/Apple Polish) */}
      <Animated.View
        style={[
          styles.inputWrapper,
          {
            borderColor: animatedBorderColor,
            backgroundColor: animatedBackgroundColor,
            shadowOpacity: animatedShadowOpacity,
          },
          disabled && styles.inputWrapperDisabled,
        ]}
      >
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={displayInput}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="YYYY - MM - DD"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={10}
          editable={!disabled}
          selectionColor={BRAND_RED}
          accessibilityLabel={`${label} ${calendarMode} input`}
        />

        {/* Right-Aligned Weighted Calendar Icon */}
        <TouchableOpacity
          style={styles.calendarActionBtn}
          onPress={() => !disabled && setIsCalendarOpen(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Open visual calendar modal"
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={activeError ? ERROR_RED : isFocused ? BRAND_RED : '#9CA3AF'}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* 3. Graceful Animated Error / Warning Text */}
      {activeError ? (
        <Animated.View
          style={[
            styles.errorRow,
            {
              opacity: errorAnim,
              transform: [
                {
                  translateY: errorAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-4, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons
            name="alert-circle"
            size={13}
            color={ERROR_RED}
            style={styles.errorIcon}
          />
          <Text style={styles.errorText}>{activeError}</Text>
        </Animated.View>
      ) : null}

      {/* 4. Unified Interactive Calendar Modal */}
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
    marginBottom: 28, // Spacious whitespace between form groups
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#374151', // Crisp dark gray
    letterSpacing: -0.2,
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
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56, // Spacious 56px height
    shadowColor: BRAND_RED,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  inputWrapperDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  textInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: '#111827',
    letterSpacing: 0.5,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  calendarActionBtn: {
    padding: 6,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  errorIcon: {
    marginRight: 5,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: ERROR_RED,
    letterSpacing: -0.1,
  },
});
