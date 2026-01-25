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


