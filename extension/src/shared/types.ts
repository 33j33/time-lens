/**
 * Shared types for Time Lens extension
 */

// ============================================================================
// Selection Snapshot
// ============================================================================

export interface SelectionSnapshot {
  /** Incremented on each meaningful selection update */
  version: number;
  /** Trimmed selection text (capped at 200 chars) */
  text: string;
  /** For per-site settings lookup */
  sourceHint: {
    origin: string;
  };
}

// ============================================================================
// Parse Result
// ============================================================================

export interface ParsedTime {
  /** Original text that was parsed */
  originalText: string;
  /** ISO string of the parsed date/time */
  isoString: string;
  /** The source timezone that was determined (IANA zone or offset like '+05:30') */
  sourceZone: string;
  /** Whether the source zone was explicitly in the text vs inferred */
  sourceZoneExplicit: boolean;
  /** Extracted timezone abbreviation if any (e.g., 'PST', 'EST') */
  abbreviation?: string;
}

export interface ConvertedTime {
  /** IANA timezone or 'local' */
  zone: string;
  /** Display label for the zone (e.g., 'Local', 'America/New_York') */
  label: string;
  /** Formatted time string */
  formatted: string;
  /** ISO string for this zone */
  isoString: string;
}

export interface ParseResult {
  /** The original parsed time info */
  parsed: ParsedTime;
  /** Local time conversion */
  local: ConvertedTime;
  /** Default target zone conversion */
  target: ConvertedTime;
}

// ============================================================================
// Settings & Storage
// ============================================================================

export type FormatPreset = 'system' | 'iso' | 'short' | 'long' | 'custom';

export interface Settings {
  /** Per-site enabled state (key is origin, e.g., 'https://github.com') */
  enabledSites: Record<string, boolean>;
  /** The default target zone to convert to */
  defaultTargetZone: 'local' | string;
  /** Format preset for displaying times */
  formatPreset: FormatPreset;
  /** Custom Luxon format string when formatPreset is 'custom' */
  customFormat: string;
}

// ============================================================================
// Default Settings
// ============================================================================

export const DEFAULT_SETTINGS: Settings = {
  enabledSites: {},
  defaultTargetZone: 'local',
  formatPreset: 'system',
  customFormat: 'ff',
};

// ============================================================================
// Message Types (for background <-> content script communication)
// ============================================================================

export type MessageType = 
  | { type: 'GET_SETTINGS'; }
  | { type: 'SETTINGS_UPDATED'; settings: Settings; }
  | { type: 'INJECTION_COMPLETE'; };

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
