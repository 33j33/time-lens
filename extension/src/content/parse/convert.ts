/**
 * Time conversion module
 * Converts parsed times to target timezones using Luxon
 */

import { DateTime } from 'luxon';
import type { ParsedTime, ConvertedTime, ParseResult, Settings } from '@/shared/types';
import type { ChronoParseResult } from './chrono';
import { resolveSourceZone, getZoneLabel, isOffset } from './timezone';
import { formatTime } from './format';

/**
 * Convert a parsed time to all target timezones
 */
export function convertTime(
  parseResult: ChronoParseResult,
  settings: Settings,
  origin?: string
): ParseResult | null {
  // Resolve the source timezone
  const sourceZone = resolveSourceZone(parseResult.timezoneOffsetMinutes);

  console.log('[Time Lens] Convert debug:', {
    matchedText: parseResult.matchedText,
    date: parseResult.date,
    dateISO: parseResult.date.toISOString(),
    timezoneOffsetMinutes: parseResult.timezoneOffsetMinutes,
    hasExplicitTimezone: parseResult.hasExplicitTimezone,
    sourceZone,
  });

  // Create a DateTime from the parsed date in the source timezone
  let sourceDateTime: DateTime;

  try {
    if (parseResult.hasExplicitTimezone) {
      // Chrono already parsed and handled the timezone (offset or abbreviation)
      // The Date object is already in UTC accounting for the timezone
      // Create DateTime from it and then set to the source zone for display
      sourceDateTime = DateTime.fromJSDate(parseResult.date, { zone: 'utc' });
      
      console.log('[Time Lens] After fromJSDate(utc):', sourceDateTime.toISO());
      
      // Now set to the actual source zone (for proper formatting/display)
      if (sourceZone !== 'local') {
        const zone = isOffset(sourceZone) ? `UTC${sourceZone}` : sourceZone;
        sourceDateTime = sourceDateTime.setZone(zone);
        console.log('[Time Lens] After setZone(' + zone + '):', sourceDateTime.toISO());
      }
    } else if (sourceZone === 'local') {
      // No explicit timezone in text, interpret as local time
      sourceDateTime = DateTime.fromJSDate(parseResult.date);
    } else {
      // This case shouldn't happen - no explicit timezone but sourceZone isn't local
      // Fallback to local interpretation
      sourceDateTime = DateTime.fromJSDate(parseResult.date);
    }

    if (!sourceDateTime.isValid) {
      console.debug('[Time Lens] Invalid source DateTime');
      return null;
    }
  } catch (error) {
    console.debug('[Time Lens] Error creating source DateTime:', error);
    return null;
  }

  // Build the parsed time info
  const parsed: ParsedTime = {
    originalText: parseResult.matchedText,
    isoString: sourceDateTime.toISO() ?? '',
    sourceZone,
    sourceZoneExplicit: parseResult.hasExplicitTimezone,
  };

  // Convert to local time
  const localDateTime = sourceDateTime.toLocal();
  const local: ConvertedTime = {
    zone: 'local',
    label: 'Local',
    formatted: formatTime(localDateTime, settings.formatPreset, settings.customFormat),
    isoString: localDateTime.toISO() ?? '',
  };

  // Convert to default target zone
  const targetDateTime = convertToZone(sourceDateTime, settings.defaultTargetZone);
  const target: ConvertedTime = {
    zone: settings.defaultTargetZone,
    label: getZoneLabel(settings.defaultTargetZone),
    formatted: formatTime(targetDateTime, settings.formatPreset, settings.customFormat),
    isoString: targetDateTime.toISO() ?? '',
  };

  return {
    parsed,
    local,
    target,
  };
}

/**
 * Convert a DateTime to a specific timezone
 */
function convertToZone(dt: DateTime, zone: string): DateTime {
  if (zone === 'local') {
    return dt.toLocal();
  }
  
  if (isOffset(zone)) {
    return dt.setZone(`UTC${zone}`);
  }
  
  return dt.setZone(zone);
}

