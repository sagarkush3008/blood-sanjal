import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getNepaliDateInstance,
  getDaysInBsMonth,
  bsToJsDate,
  formatADDisplay,
  formatBSDisplay,
  NEPALI_MONTH_NAMES_EN,
  parseADStringToDate,
  parseBSStringToDate,
} from '../../utils/nepaliDate.utils';
import { fonts } from '../../theme';

export type CalendarSystem = 'AD' | 'BS';

export interface CalendarPickerModalProps {
  visible: boolean;
  selectedDate?: string | Date; // e.g., '2026-10-21' or '2083-07-04' or Date
  calendarSystem?: CalendarSystem; // Default 'AD'
  onToggleCalendarSystem?: (system: CalendarSystem) => void;
  onClose: () => void;
  onSelectDate: (formatted: string, standardDate: Date) => void;
  format?: 'MM/DD/YYYY' | 'YYYY-MM-DD';
  maxDate?: Date;
}

const GREGORIAN_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const BRAND_RED = '#E63946';

export const CalendarPickerModal: React.FC<CalendarPickerModalProps> = ({
  visible,
  selectedDate,
  calendarSystem = 'AD',
  onToggleCalendarSystem,
  onClose,
  onSelectDate,
  format = 'YYYY-MM-DD',
  maxDate = new Date(),
}) => {
  const [activeSystem, setActiveSystem] = useState<CalendarSystem>(calendarSystem);

  // Parse initial date to standard JS Date
  const parseInitialDate = (): Date => {
    if (!selectedDate) return new Date();
    if (selectedDate instanceof Date) return selectedDate;

    // Try BS parser first if string contains BS or year is 207x/208x
    if (selectedDate.includes('BS') || selectedDate.startsWith('207') || selectedDate.startsWith('208')) {
      const bsParsed = parseBSStringToDate(selectedDate);
      if (bsParsed) return bsParsed;
    }

    const adParsed = parseADStringToDate(selectedDate);
    if (adParsed) return adParsed;

    const fallback = new Date(selectedDate);
    return isNaN(fallback.getTime()) ? new Date() : fallback;
  };

  const [currentJsDate, setCurrentJsDate] = useState<Date>(parseInitialDate());

  // AD state
  const [adMonthDate, setAdMonthDate] = useState<Date>(parseInitialDate());

  // BS state (year, month 0-11)
  const initialNd = getNepaliDateInstance(parseInitialDate());
  const [bsYear, setBsYear] = useState<number>(initialNd.getYear());
  const [bsMonth, setBsMonth] = useState<number>(initialNd.getMonth());

  useEffect(() => {
    if (visible) {
      const init = parseInitialDate();
      setCurrentJsDate(init);
      setAdMonthDate(init);
      const nd = getNepaliDateInstance(init);
      setBsYear(nd.getYear());
      setBsMonth(nd.getMonth());
      setActiveSystem(calendarSystem);
    }
  }, [visible, selectedDate, calendarSystem]);

  const handleSystemChange = (sys: CalendarSystem) => {
    setActiveSystem(sys);
    if (onToggleCalendarSystem) {
      onToggleCalendarSystem(sys);
    }
    // Synchronize views
    if (sys === 'BS') {
      const nd = getNepaliDateInstance(currentJsDate);
      setBsYear(nd.getYear());
      setBsMonth(nd.getMonth());
    } else {
      setAdMonthDate(new Date(currentJsDate));
    }
  };

  // ----------------------------------------------------------------------
  // AD Navigation & Logic
  // ----------------------------------------------------------------------
  const adYear = adMonthDate.getFullYear();
  const adMonth = adMonthDate.getMonth();

  const handlePrevAdMonth = () => {
    setAdMonthDate(new Date(adYear, adMonth - 1, 1));
  };

  const handleNextAdMonth = () => {
    const nextMonth = new Date(adYear, adMonth + 1, 1);
    if (maxDate && (nextMonth.getFullYear() > maxDate.getFullYear() || (nextMonth.getFullYear() === maxDate.getFullYear() && nextMonth.getMonth() > maxDate.getMonth()))) {
      return;
    }
    setAdMonthDate(nextMonth);
  };

  const adDaysInMonth = new Date(adYear, adMonth + 1, 0).getDate();
  const adFirstDayOfWeek = new Date(adYear, adMonth, 1).getDay();

  const handleSelectAdDay = (day: number) => {
    const candidate = new Date(adYear, adMonth, day);
    if (maxDate && candidate.getTime() > maxDate.getTime() + 86400000) {
      return;
    }
    setCurrentJsDate(candidate);
    const formatted = formatADDisplay(candidate, format);
    onSelectDate(formatted, candidate);
    onClose();
  };

  // ----------------------------------------------------------------------
  // BS Navigation & Logic
  // ----------------------------------------------------------------------
  const handlePrevBsMonth = () => {
    if (bsMonth === 0) {
      if (bsYear > 2000) {
        setBsYear(bsYear - 1);
        setBsMonth(11);
      }
    } else {
      setBsMonth(bsMonth - 1);
    }
  };

  const handleNextBsMonth = () => {
    if (bsMonth === 11) {
      if (bsYear < 2090) {
        setBsYear(bsYear + 1);
        setBsMonth(0);
      }
    } else {
      setBsMonth(bsMonth + 1);
    }
  };

  const bsDaysInMonth = getDaysInBsMonth(bsYear, bsMonth);
  const bsFirstDayOfWeek = getNepaliDateInstance(bsToJsDate(bsYear, bsMonth, 1)).getDay();

  const handleSelectBsDay = (day: number) => {
    const jsCandidate = bsToJsDate(bsYear, bsMonth, day);
    if (maxDate && jsCandidate.getTime() > maxDate.getTime() + 86400000) {
      return;
    }
    setCurrentJsDate(jsCandidate);
    const formatted = formatBSDisplay(jsCandidate, 'numeric');
    onSelectDate(formatted, jsCandidate);
    onClose();
  };

  // Handle Pick Today (Strictly English Localization)
  const handleSelectToday = () => {
    const today = new Date();
    setCurrentJsDate(today);
    if (activeSystem === 'BS') {
      const formatted = formatBSDisplay(today, 'numeric');
      onSelectDate(formatted, today);
    } else {
      const formatted = formatADDisplay(today, format);
      onSelectDate(formatted, today);
    }
    onClose();
  };

  // Selected date match checks
  const isSelectedAd = (day: number) => {
    return (
      currentJsDate.getDate() === day &&
      currentJsDate.getMonth() === adMonth &&
      currentJsDate.getFullYear() === adYear
    );
  };

  const isTodayAd = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === adMonth &&
      today.getFullYear() === adYear
    );
  };

  const isFutureAd = (day: number) => {
    if (!maxDate) return false;
    const testDate = new Date(adYear, adMonth, day, 23, 59, 59);
    return testDate.getTime() > maxDate.getTime();
  };

  // BS match checks
  const currentNd = getNepaliDateInstance(currentJsDate);
  const todayNd = getNepaliDateInstance(new Date());

  const isSelectedBs = (day: number) => {
    return (
      currentNd.getDate() === day &&
      currentNd.getMonth() === bsMonth &&
      currentNd.getYear() === bsYear
    );
  };

  const isTodayBs = (day: number) => {
    return (
      todayNd.getDate() === day &&
      todayNd.getMonth() === bsMonth &&
      todayNd.getYear() === bsYear
    );
  };

  const isFutureBs = (day: number) => {
    if (!maxDate) return false;
    const testJs = bsToJsDate(bsYear, bsMonth, day);
    testJs.setHours(23, 59, 59, 999);
    return testJs.getTime() > maxDate.getTime();
  };

  // ----------------------------------------------------------------------
  // Render Days Grid
  // ----------------------------------------------------------------------
  const renderAdGrid = () => {
    const cells = [];
    for (let i = 0; i < adFirstDayOfWeek; i++) {
      cells.push(<View key={`ad-empty-${i}`} style={styles.dayCell} />);
    }
    for (let day = 1; day <= adDaysInMonth; day++) {
      const future = isFutureAd(day);
      const active = isSelectedAd(day);
      const todayCell = isTodayAd(day);

      cells.push(
        <TouchableOpacity
          key={`ad-day-${day}`}
          style={[
            styles.dayCell,
            active && styles.dayCellActive,
            todayCell && !active && styles.dayCellToday,
          ]}
          disabled={future}
          onPress={() => handleSelectAdDay(day)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dayText,
              active && styles.dayTextActive,
              future && styles.dayTextDisabled,
              todayCell && !active && styles.dayTextToday,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    return cells;
  };

  const renderBsGrid = () => {
    const cells = [];
    for (let i = 0; i < bsFirstDayOfWeek; i++) {
      cells.push(<View key={`bs-empty-${i}`} style={styles.dayCell} />);
    }
    for (let day = 1; day <= bsDaysInMonth; day++) {
      const future = isFutureBs(day);
      const active = isSelectedBs(day);
      const todayCell = isTodayBs(day);

      cells.push(
        <TouchableOpacity
          key={`bs-day-${day}`}
          style={[
            styles.dayCell,
            active && styles.dayCellActive,
            todayCell && !active && styles.dayCellToday,
          ]}
          disabled={future}
          onPress={() => handleSelectBsDay(day)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dayText,
              active && styles.dayTextActive,
              future && styles.dayTextDisabled,
              todayCell && !active && styles.dayTextToday,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    return cells;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.calendarCard}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="calendar" size={17} color={BRAND_RED} style={{ marginRight: 6 }} />
              <Text style={styles.headerTitle}>Select Date</Text>
            </View>

            {/* AD / BS Dual Segmented Pill Switch */}
            <View style={styles.segmentedToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleSegment,
                  activeSystem === 'AD' && styles.toggleSegmentActive,
                ]}
                onPress={() => handleSystemChange('AD')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.toggleSegmentText,
                    activeSystem === 'AD' && styles.toggleSegmentTextActive,
                  ]}
                >
                  AD
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleSegment,
                  activeSystem === 'BS' && styles.toggleSegmentActive,
                ]}
                onPress={() => handleSystemChange('BS')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.toggleSegmentText,
                    activeSystem === 'BS' && styles.toggleSegmentTextActive,
                  ]}
                >
                  BS
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Month / Year Navigator */}
          <View style={styles.monthNavigator}>
            <TouchableOpacity
              onPress={activeSystem === 'AD' ? handlePrevAdMonth : handlePrevBsMonth}
              style={styles.navArrow}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color="#0F172A" />
            </TouchableOpacity>

            <View style={styles.monthTitleWrapper}>
              <Text style={styles.monthTitle}>
                {activeSystem === 'AD'
                  ? `${GREGORIAN_MONTH_NAMES[adMonth]} ${adYear}`
                  : `${NEPALI_MONTH_NAMES_EN[bsMonth]} ${bsYear}`}
              </Text>
            </View>

            <TouchableOpacity
              onPress={activeSystem === 'AD' ? handleNextAdMonth : handleNextBsMonth}
              style={styles.navArrow}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* Weekday Labels (Always strictly in English) */}
          <View style={styles.weekdaysRow}>
            {WEEKDAY_NAMES_EN.map((w, idx) => (
              <Text key={idx} style={[styles.weekdayLabel, idx === 0 && { color: BRAND_RED }]}>
                {w}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {activeSystem === 'AD' ? renderAdGrid() : renderBsGrid()}
          </View>

          {/* Footer Quick Actions - Strictly "Today" in English */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.todayButton} onPress={handleSelectToday} activeOpacity={0.75}>
              <Ionicons name="today-outline" size={15} color={BRAND_RED} style={{ marginRight: 5 }} />
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#0F172A',
  },
  segmentedToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleSegment: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 11,
  },
  toggleSegmentActive: {
    backgroundColor: BRAND_RED,
  },
  toggleSegmentText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: '#64748B',
  },
  toggleSegmentTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  monthTitleWrapper: {
    alignItems: 'center',
  },
  monthTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    marginBottom: 4,
  },
  weekdayLabel: {
    width: 38,
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: '#64748B',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 19,
  },
  dayCellActive: {
    backgroundColor: BRAND_RED,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: BRAND_RED,
  },
  dayText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#1E293B',
  },
  dayTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
  },
  dayTextToday: {
    color: BRAND_RED,
    fontFamily: fonts.bold,
  },
  dayTextDisabled: {
    color: '#CBD5E1',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFF1F2',
  },
  todayButtonText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: BRAND_RED,
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#64748B',
  },
});
