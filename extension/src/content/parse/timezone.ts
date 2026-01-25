/**
 * Timezone resolution utilities
 * Maps abbreviations to IANA zones and resolves source zones
 */

import { TIMEZONE_ABBREVIATIONS, COMMON_TIMEZONES } from '@/shared/constants';

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
 * Priority: explicit offset > abbreviation > local
 */
export function resolveSourceZone(
  explicitOffset: string | undefined,
  abbreviation: string | undefined
): string {
  // 1. Explicit offset in the text takes highest priority
  if (explicitOffset) {
    return explicitOffset;
  }

  // 2. Known timezone abbreviation
  if (abbreviation && TIMEZONE_ABBREVIATIONS[abbreviation]) {
    return TIMEZONE_ABBREVIATIONS[abbreviation];
  }

  // 3. Default to local timezone
  return 'local';
}

/**
 * Convert an offset string to minutes
 * e.g., '+05:30' -> 330, '-08:00' -> -480
 */
export function offsetToMinutes(offset: string): number {
  const match = offset.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) {
    return 0;
  }
  
  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3], 10);
  
  return sign * (hours * 60 + minutes);
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

