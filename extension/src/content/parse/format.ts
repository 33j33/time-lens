/**
 * Time formatting module
 * Formats DateTime objects using Luxon with preset or custom formats
 */

import { DateTime } from 'luxon';
import type { FormatPreset } from '@/shared/types';
import { FORMAT_PRESETS } from '@/shared/constants';

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

