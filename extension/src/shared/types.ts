/**
 * Shared types for Time Lens extension
 */

// ============================================================================
// Tooltip State Machine
// ============================================================================

export enum TooltipState {
  /** No valid selection or tooltip hidden */
  IDLE = 'IDLE',
  /** Tooltip visible, will hide when pointer leaves tooltip */
  PREVIEW = 'PREVIEW',
  /** Tooltip visible + pointer is inside tooltip. Stays until pointer leaves. */
  PINNED = 'PINNED',
}

// ============================================================================
// Selection Snapshot
// ============================================================================

export interface SelectionSnapshot {
  /** Incremented on each meaningful selection update */
  version: number;
  /** Trimmed selection text (capped at 200 chars) */
  text: string;
  /** Anchor point for tooltip (bottom-left of selection) */
  anchorX: number;
  anchorY: number;
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
  /** Primary target zone conversion */
  primary: ConvertedTime;
  /** All configured target zone conversions */
  targets: ConvertedTime[];
}

// ============================================================================
// Settings & Storage
// ============================================================================

export type FormatPreset = 'system' | 'iso' | 'short' | 'long' | 'custom';

export interface Settings {
  /** Whether Time Lens is globally enabled */
  enabled: boolean;
  /** Default source timezone when not explicit in text */
  defaultSourceZone: 'local' | string;
  /** List of target timezones to convert to */
  targetZones: string[];
  /** The primary target zone to show prominently */
  primaryTargetZone: 'local' | string;
  /** Format preset for displaying times */
  formatPreset: FormatPreset;
  /** Custom Luxon format string when formatPreset is 'custom' */
  customFormat: string;
  /** Per-site source timezone overrides */
  perSiteSourceZone: Record<string, string>;
}


// ============================================================================
// Default Settings
// ============================================================================

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  defaultSourceZone: 'local',
  targetZones: ['local', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo'],
  primaryTargetZone: 'local',
  formatPreset: 'system',
  customFormat: 'ff',
  perSiteSourceZone: {},
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
