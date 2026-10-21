import NepaliDate, { dateConfigMap } from 'nepali-date-converter';

// Resolve any CJS/ESM interop differences
const ResolvedNepaliDate: typeof NepaliDate =
  (NepaliDate as any)?.default || NepaliDate;

export const NEPALI_MONTH_NAMES_EN = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
];

export const NEPALI_MONTH_NAMES_NP = [
  'बैशाख',
  'जेठ',
  'असार',
  'साउन',
  'भदौ',
  'असोज',
  'कार्तिक',
  'मंसिर',
  'पुस',
  'माघ',
  'फागुन',
  'चैत',
];

export const NEPALI_WEEKDAYS_SHORT = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिही', 'शुक्र', 'शनि'];

/**
 * Convert a standard Gregorian JS Date to a NepaliDate instance
 */
export const getNepaliDateInstance = (date: Date = new Date()): NepaliDate => {
  try {
    return new ResolvedNepaliDate(date);
  } catch (err) {
    console.warn('[nepaliDate.utils] Failed to convert Date to NepaliDate:', err);
    return new ResolvedNepaliDate(new Date());
  }
};

/**
 * Get number of days in a given BS year and month (0-indexed month)
 */
export const getDaysInBsMonth = (bsYear: number, bsMonthIndex: number): number => {
  const config = (dateConfigMap as any)?.[bsYear];
  if (!config) {
    return 30; // sensible fallback
  }
  const monthKeys = [
    'Baisakh',
    'Jestha',
    'Asar',
    'Shrawan',
    'Bhadra',
    'Aswin',
    'Kartik',
    'Mangsir',
    'Poush',
    'Magh',
    'Falgun',
    'Chaitra',
  ];
  const key = monthKeys[bsMonthIndex] || 'Baisakh';
  return config[key] || 30;
};

/**
 * Format a standard Gregorian Date for AD display
 */
export const formatADDisplay = (date: Date, style: 'MM/DD/YYYY' | 'YYYY-MM-DD' = 'MM/DD/YYYY'): string => {
  if (!date || isNaN(date.getTime())) return '';
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  if (style === 'YYYY-MM-DD') {
    return `${yyyy}-${mm}-${dd}`;
  }
  return `${mm}/${dd}/${yyyy}`;
};

/**
 * Format a standard Gregorian Date as Bikram Sambat (BS) display string
 * e.g., '2083-07-04' (numeric) or '2083/07/04'
 */
export const formatBSDisplay = (
  date: Date,
  mode: 'numeric' | 'short' | 'verbose' | 'bilingual' = 'numeric'
): string => {
  if (!date || isNaN(date.getTime())) return '';
  try {
    const nd = new ResolvedNepaliDate(date);
    const bsYear = nd.getYear();
    const bsMonthIndex = nd.getMonth();
    const bsDate = nd.getDate();
    const paddedMonth = String(bsMonthIndex + 1).padStart(2, '0');
    const paddedDate = String(bsDate).padStart(2, '0');
    const monthEn = NEPALI_MONTH_NAMES_EN[bsMonthIndex] || '';
    const monthNp = NEPALI_MONTH_NAMES_NP[bsMonthIndex] || '';

    if (mode === 'numeric') {
      return `${bsYear}-${paddedMonth}-${paddedDate}`;
    }
    if (mode === 'short') {
      return `${bsYear}/${paddedMonth}/${paddedDate}`;
    }
    if (mode === 'bilingual') {
      return `${monthEn} (${monthNp}) ${paddedDate}, ${bsYear} BS`;
    }
    // Default verbose
    return `${monthEn} ${paddedDate}, ${bsYear} BS`;
  } catch (err) {
    console.warn('[nepaliDate.utils] formatBSDisplay error:', err);
    return '';
  }
};

/**
 * Parse an AD string (mm/dd/yyyy or yyyy-mm-dd) into standard JS Date
 */
export const parseADStringToDate = (input: string): Date | null => {
  if (!input) return null;
  const trimmed = input.trim();

  // Try mm/dd/yyyy
  const slashParts = trimmed.split('/');
  if (slashParts.length === 3) {
    const mm = parseInt(slashParts[0], 10) - 1;
    const dd = parseInt(slashParts[1], 10);
    const yyyy = parseInt(slashParts[2], 10);
    if (!isNaN(mm) && !isNaN(dd) && !isNaN(yyyy) && yyyy >= 1970 && yyyy <= 2100) {
      const d = new Date(yyyy, mm, dd);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // Try yyyy-mm-dd
  const dashParts = trimmed.split('-');
  if (dashParts.length === 3) {
    const yyyy = parseInt(dashParts[0], 10);
    const mm = parseInt(dashParts[1], 10) - 1;
    const dd = parseInt(dashParts[2], 10);
    if (!isNaN(mm) && !isNaN(dd) && !isNaN(yyyy) && yyyy >= 1970 && yyyy <= 2100) {
      const d = new Date(yyyy, mm, dd);
      if (!isNaN(d.getTime())) return d;
    }
  }

  return null;
};

/**
 * Parse a BS date string (e.g. '2083/07/04' or '2083-07-04') into standard Gregorian JS Date
 */
export const parseBSStringToDate = (input: string): Date | null => {
  if (!input) return null;
  const clean = input.replace(/\s*BS\s*$/i, '').trim();

  const parts = clean.includes('/') ? clean.split('/') : clean.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    if (year >= 2000 && year <= 2090 && month >= 0 && month <= 11 && day >= 1 && day <= 32) {
      try {
        const nd = new ResolvedNepaliDate(year, month, day);
        const jsDate = nd.toJsDate();
        if (!isNaN(jsDate.getTime())) return jsDate;
      } catch (err) {
        console.warn('[nepaliDate.utils] parseBSStringToDate error:', err);
      }
    }
  }
  return null;
};

/**
 * Convert BS Year, MonthIndex (0-11), and Day to Gregorian JS Date
 */
export const bsToJsDate = (year: number, monthIndex: number, day: number): Date => {
  try {
    const nd = new ResolvedNepaliDate(year, monthIndex, day);
    return nd.toJsDate();
  } catch (err) {
    console.warn('[nepaliDate.utils] bsToJsDate error:', err);
    return new Date();
  }
};
