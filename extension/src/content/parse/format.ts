/**
 * Time formatting module
 * Formats DateTime objects using Luxon with preset or custom formats
 */

import { DateTime } from 'luxon';
import type { FormatPreset } from '@/shared/types';

/**
 * Format presets mapped to Luxon format options
 */
const FORMAT_PRESETS: Record<Exclude<FormatPreset, 'custom'>, (dt: DateTime) => string> = {
  system: (dt) => dt.toLocaleString(DateTime.DATETIME_MED),
  iso: (dt) => dt.toISO({ suppressMilliseconds: true }) ?? '',
  short: (dt) => dt.toLocaleString(DateTime.DATETIME_SHORT),
  long: (dt) => dt.toLocaleString(DateTime.DATETIME_FULL),
};

/**
 * Format a DateTime using the specified preset or custom format
 */
export function formatTime(
  dt: DateTime,
  preset: FormatPreset,
  customFormat?: string
): string {
  if (!dt.isValid) {
    return 'Invalid date';
  }

  if (preset === 'custom' && customFormat) {
    try {
      return dt.toFormat(customFormat);
    } catch {
      // Fall back to system format if custom format is invalid
      return FORMAT_PRESETS.system(dt);
    }
  }

  const formatter = FORMAT_PRESETS[preset as Exclude<FormatPreset, 'custom'>];
  if (formatter) {
    return formatter(dt);
  }

  // Default fallback
  return FORMAT_PRESETS.system(dt);
}

/**
 * Format the date portion only
 */
export function formatDate(dt: DateTime, preset: FormatPreset): string {
  if (!dt.isValid) {
    return 'Invalid date';
  }

  switch (preset) {
    case 'iso':
      return dt.toISODate() ?? '';
    case 'short':
      return dt.toLocaleString(DateTime.DATE_SHORT);
    case 'long':
      return dt.toLocaleString(DateTime.DATE_FULL);
    case 'system':
    default:
      return dt.toLocaleString(DateTime.DATE_MED);
  }
}

/**
 * Format the time portion only
 */
export function formatTimeOnly(dt: DateTime, preset: FormatPreset): string {
  if (!dt.isValid) {
    return 'Invalid time';
  }

  switch (preset) {
    case 'iso':
      return dt.toISOTime({ suppressMilliseconds: true }) ?? '';
    case 'short':
      return dt.toLocaleString(DateTime.TIME_SIMPLE);
    case 'long':
      return dt.toLocaleString(DateTime.TIME_WITH_SECONDS);
    case 'system':
    default:
      return dt.toLocaleString(DateTime.TIME_SIMPLE);
  }
}

/**
 * Get a preview of how a format string will render
 */
export function getFormatPreview(customFormat: string): string {
  try {
    return DateTime.now().toFormat(customFormat);
  } catch {
    return 'Invalid format';
  }
}

/**
 * Common Luxon format tokens for reference
 */
export const FORMAT_TOKENS = {
  // Year
  'yyyy': 'Full year (2024)',
  'yy': 'Two-digit year (24)',
  // Month
  'MMMM': 'Full month name (January)',
  'MMM': 'Short month name (Jan)',
  'MM': 'Two-digit month (01)',
  'M': 'Month number (1)',
  // Day
  'dd': 'Two-digit day (05)',
  'd': 'Day number (5)',
  'EEEE': 'Full weekday (Monday)',
  'EEE': 'Short weekday (Mon)',
  // Hour
  'HH': '24-hour two-digit (14)',
  'H': '24-hour (14)',
  'hh': '12-hour two-digit (02)',
  'h': '12-hour (2)',
  // Minute
  'mm': 'Two-digit minute (05)',
  'm': 'Minute (5)',
  // Second
  'ss': 'Two-digit second (09)',
  's': 'Second (9)',
  // AM/PM
  'a': 'AM/PM',
  // Timezone
  'z': 'Timezone abbrev (PST)',
  'Z': 'Offset (+08:00)',
  'ZZZZ': 'Full offset name',
};

