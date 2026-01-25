/**
 * Centralized constants for Time Lens extension
 */

import type { Settings, FormatPreset } from './types';
import { DateTime } from 'luxon';

// ============================================================================
// Settings & Storage
// ============================================================================

/** Default settings for the extension */
export const DEFAULT_SETTINGS: Settings = {
  enabledSites: {},
  defaultTargetZone: 'local',
  formatPreset: 'system',
  customFormat: 'ff',
};

/** Default enabled state for sites not explicitly configured */
export const DEFAULT_ENABLED = false;

/** Chrome storage key for settings */
export const SETTINGS_KEY = 'settings';

// ============================================================================
// Panel UI
// ============================================================================

/** LocalStorage key for panel position */
export const PANEL_POSITION_KEY = 'tl-panel-position';

/** Default panel top position (px) */
export const PANEL_DEFAULT_TOP = 16;

/** Default panel right position (px) */
export const PANEL_DEFAULT_RIGHT = 16;

/** Minimum padding from viewport edges (px) */
export const PANEL_VIEWPORT_PADDING = 8;

// ============================================================================
// Selection Tracking
// ============================================================================

/** Maximum length of selection text to process */
export const MAX_SELECTION_LENGTH = 200;

/** Debounce delay for selection changes (ms) */
export const SELECTION_DEBOUNCE_DELAY = 50;

// ============================================================================
// Timezone Parsing
// ============================================================================

/** Regex pattern for offset detection (e.g., '+05:30', '-08:00', 'Z') */
export const OFFSET_PATTERN = /([+-]\d{1,2}:?\d{2}|Z)\s*$/i;

/** Regex pattern for timezone abbreviation detection (e.g., 'PST', 'EST') */
export const ABBREV_PATTERN = /\b([A-Z]{2,5}T?)\s*$/i;

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

// ============================================================================
// Time Formatting
// ============================================================================

/**
 * Format presets mapped to Luxon format functions
 * @internal Used by formatTime function
 */
export const FORMAT_PRESETS: Record<Exclude<FormatPreset, 'custom'>, (dt: DateTime) => string> = {
  system: (dt) => dt.toLocaleString(DateTime.DATETIME_MED),
  iso: (dt) => dt.toISO({ suppressMilliseconds: true }) ?? '',
  short: (dt) => dt.toLocaleString(DateTime.DATETIME_SHORT),
  long: (dt) => dt.toLocaleString(DateTime.DATETIME_FULL),
};

/**
 * Common Luxon format tokens for reference
 * Used in UI to help users construct custom formats
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

// ============================================================================
// Common Timezones (for UI dropdowns)
// ============================================================================

/**
 * List of common IANA timezone names for UI dropdowns
 */
export const COMMON_TIMEZONES = [
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
