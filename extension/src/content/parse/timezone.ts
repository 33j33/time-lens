/**
 * Timezone resolution utilities
 * Maps abbreviations to IANA zones and resolves source zones
 */

import { COMMON_TIMEZONES } from '@/shared/constants';

/**
 * Get display label for a timezone
 */
export function getZoneLabel(zone: string): string {
  if (zone === 'local') {
    return 'Local';
  }
  if (zone === 'UTC') {
    return 'UTC';
  }
  // For IANA zones, try to make a nicer label
  const parts = zone.split('/');
  if (parts.length === 2) {
    return parts[1].replace(/_/g, ' ');
  }
  return zone;
}

/**
 * Resolve the source timezone for a parsed time
 * Returns the timezone offset in "+HH:MM" format, or 'local' if no timezone was specified
 */
export function resolveSourceZone(
  timezoneOffsetMinutes: number | undefined
): string {
  // If explicit offset present, convert to "+HH:MM" format for Luxon
  if (timezoneOffsetMinutes !== undefined) {
    return minutesToOffset(timezoneOffsetMinutes);
  }

  // Default to local timezone
  return 'local';
}

/**
 * Convert offset in minutes to "+HH:MM" format
 * e.g., 330 -> "+05:30", -480 -> "-08:00", 0 -> "+00:00"
 */
export function minutesToOffset(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-';
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  
  return `${sign}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Check if a string is an offset (like '+05:30') vs an IANA zone
 */
export function isOffset(zone: string): boolean {
  return /^[+-]\d{2}:\d{2}$/.test(zone);
}

/**
 * Get a list of common IANA timezone names for UI dropdowns
 */
export function getCommonTimezones(): string[] {
  return COMMON_TIMEZONES;
}

