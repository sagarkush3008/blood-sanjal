import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CalendarPickerModalProps {
  visible: boolean;
  selectedDate?: string; // e.g., '10/21/2026' or '2026-10-21'
  onClose: () => void;
  onSelectDate: (formatted: string, date: Date) => void;
  format?: 'MM/DD/YYYY' | 'YYYY-MM-DD';
  maxDate?: Date;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const BRAND_RED = '#E63946';

export const CalendarPickerModal: React.FC<CalendarPickerModalProps> = ({
  visible,
  selectedDate,
  onClose,
  onSelectDate,
  format = 'MM/DD/YYYY',
  maxDate = new Date(),
}) => {
  // Parse initial selected date or default to current date
  const parseInitial = (): Date => {
    if (!selectedDate) return new Date();
    // Try parsing mm/dd/yyyy
    const slashParts = selectedDate.split('/');
    if (slashParts.length === 3) {
      const mm = parseInt(slashParts[0], 10) - 1;
      const dd = parseInt(slashParts[1], 10);
      const yyyy = parseInt(slashParts[2], 10);
      const parsed = new Date(yyyy, mm, dd);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    // Try parsing yyyy-mm-dd
    const dashParts = selectedDate.split('-');
    if (dashParts.length === 3) {
      const yyyy = parseInt(dashParts[0], 10);
      const mm = parseInt(dashParts[1], 10) - 1;
      const dd = parseInt(dashParts[2], 10);
      const parsed = new Date(yyyy, mm, dd);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  };

  const [activeMonthDate, setActiveMonthDate] = useState<Date>(parseInitial());
  const [pickedDate, setPickedDate] = useState<Date>(parseInitial());

  useEffect(() => {
    if (visible) {
      const initial = parseInitial();
      setActiveMonthDate(initial);
      setPickedDate(initial);
    }
  }, [visible, selectedDate]);

  const year = activeMonthDate.getFullYear();
  const month = activeMonthDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setActiveMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    // Only navigate to next month if it doesn't exceed maxDate year/month
    const nextMonth = new Date(year, month + 1, 1);
    if (maxDate && nextMonth.getFullYear() > maxDate.getFullYear() && nextMonth.getMonth() > maxDate.getMonth()) {
      return;
    }
    setActiveMonthDate(nextMonth);
  };

  // Days in month calculation
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Format date helper
  const formatDateOutput = (d: Date): string => {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    if (format === 'YYYY-MM-DD') {
      return `${yyyy}-${mm}-${dd}`;
    }
    return `${mm}/${dd}/${yyyy}`;
  };

  // Select day handler
  const handleDaySelect = (day: number) => {
    const candidate = new Date(year, month, day);
    // Ignore future dates if maxDate is set
    if (maxDate && candidate.getTime() > maxDate.getTime() + 86400000) {
      return;
    }
    setPickedDate(candidate);
    onSelectDate(formatDateOutput(candidate), candidate);
    onClose();
  };

  // Handle Pick Today
  const handleSelectToday = () => {
    const today = new Date();
    setPickedDate(today);
    onSelectDate(formatDateOutput(today), today);
    onClose();
  };

  const isSelected = (day: number) => {
    return (
      pickedDate.getDate() === day &&
      pickedDate.getMonth() === month &&
      pickedDate.getFullYear() === year
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isFuture = (day: number) => {
    if (!maxDate) return false;
    const dateToCheck = new Date(year, month, day, 23, 59, 59);
    return dateToCheck.getTime() > maxDate.getTime();
  };

  // Build grid items (padding cells + day cells)
  const gridCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    gridCells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const future = isFuture(day);
    const active = isSelected(day);
    const todayCell = isToday(day);

    gridCells.push(
      <TouchableOpacity
        key={`day-${day}`}
        style={[
          styles.dayCell,
          active && styles.dayCellActive,
          todayCell && !active && styles.dayCellToday,
        ]}
        disabled={future}
        onPress={() => handleDaySelect(day)}
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.calendarCard}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="calendar" size={18} color={BRAND_RED} style={{ marginRight: 6 }} />
              <Text style={styles.headerTitle}>Select Donation Date</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Month / Year Navigator */}
          <View style={styles.monthNavigator}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navArrow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-back" size={20} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {MONTH_NAMES[month]} {year}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navArrow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-forward" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* Weekday Labels */}
          <View style={styles.weekdaysRow}>
            {WEEKDAY_NAMES.map((w, idx) => (
              <Text key={idx} style={[styles.weekdayLabel, idx === 0 && { color: BRAND_RED }]}>
                {w}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>{gridCells}</View>

          {/* Footer Quick Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.todayButton} onPress={handleSelectToday}>
              <Ionicons name="today-outline" size={16} color={BRAND_RED} style={{ marginRight: 4 }} />
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
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
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  navArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    marginBottom: 4,
  },
  weekdayLabel: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 3,
    borderRadius: 20,
  },
  dayCellActive: {
    backgroundColor: BRAND_RED,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: BRAND_RED,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  dayTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayTextToday: {
    color: BRAND_RED,
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: '#CBD5E1',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFF1F2',
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND_RED,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
});
