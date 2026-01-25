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

// ============================================================================
// Timezone Parsing
// ============================================================================

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
