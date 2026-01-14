/**
 * Timezone resolution utilities
 * Maps abbreviations to IANA zones and resolves source zones
 */

import type { Settings } from '@/shared/types';

/**
 * Common timezone abbreviations mapped to IANA zones or UTC offsets
 * Note: Some abbreviations are ambiguous (e.g., IST could be India, Israel, or Ireland)
 * We use the most common interpretation for each
 */
export const TIMEZONE_ABBREVIATIONS: Record<string, string> = {
  // North America
  'EST': 'America/New_York',
  'EDT': 'America/New_York',
  'CST': 'America/Chicago',
  'CDT': 'America/Chicago',
  'MST': 'America/Denver',
  'MDT': 'America/Denver',
  'PST': 'America/Los_Angeles',
  'PDT': 'America/Los_Angeles',
  'AKST': 'America/Anchorage',
  'AKDT': 'America/Anchorage',
  'HST': 'Pacific/Honolulu',
  'AST': 'America/Halifax',
  'ADT': 'America/Halifax',
  'NST': 'America/St_Johns',
  'NDT': 'America/St_Johns',

  // Europe
  'GMT': 'Europe/London',
  'BST': 'Europe/London',
  'WET': 'Europe/Lisbon',
  'WEST': 'Europe/Lisbon',
  'CET': 'Europe/Paris',
  'CEST': 'Europe/Paris',
  'EET': 'Europe/Helsinki',
  'EEST': 'Europe/Helsinki',
  'MSK': 'Europe/Moscow',

  // Asia
  'IST': 'Asia/Kolkata',      // India Standard Time (most common interpretation)
  'PKT': 'Asia/Karachi',
  'BST_BD': 'Asia/Dhaka',     // Bangladesh (avoiding conflict with British Summer Time)
  'ICT': 'Asia/Bangkok',
  'WIB': 'Asia/Jakarta',
  'SGT': 'Asia/Singapore',
  'HKT': 'Asia/Hong_Kong',
  'CST_CN': 'Asia/Shanghai',  // China Standard Time
  'JST': 'Asia/Tokyo',
  'KST': 'Asia/Seoul',

  // Australia/Pacific
  'AWST': 'Australia/Perth',
  'ACST': 'Australia/Adelaide',
  'AEST': 'Australia/Sydney',
  'AEDT': 'Australia/Sydney',
  'NZST': 'Pacific/Auckland',
  'NZDT': 'Pacific/Auckland',

  // UTC
  'UTC': 'UTC',
  'Z': 'UTC',
};

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
 * Priority: explicit offset > abbreviation > per-site override > default
 */
export function resolveSourceZone(
  explicitOffset: string | undefined,
  abbreviation: string | undefined,
  settings: Settings,
  origin?: string
): string {
  // 1. Explicit offset in the text takes highest priority
  if (explicitOffset) {
    return explicitOffset;
  }

  // 2. Known timezone abbreviation
  if (abbreviation && TIMEZONE_ABBREVIATIONS[abbreviation]) {
    return TIMEZONE_ABBREVIATIONS[abbreviation];
  }

  // 3. Per-site override
  if (origin && settings.perSiteSourceZone[origin]) {
    return settings.perSiteSourceZone[origin];
  }

  // 4. Default source zone from settings
  return settings.defaultSourceZone;
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
  return [
    'local',
    'UTC',
    // Americas
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'America/Toronto',
    'America/Vancouver',
    'America/Mexico_City',
    'America/Sao_Paulo',
    // Europe
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Amsterdam',
    'Europe/Madrid',
    'Europe/Rome',
    'Europe/Moscow',
    // Asia
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Bangkok',
    'Asia/Singapore',
    'Asia/Hong_Kong',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Seoul',
    // Australia/Pacific
    'Australia/Sydney',
    'Australia/Melbourne',
    'Australia/Perth',
    'Pacific/Auckland',
    'Pacific/Honolulu',
  ];
}

