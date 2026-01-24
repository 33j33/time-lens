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
  const sourceZone = resolveSourceZone(
    parseResult.explicitOffset,
    parseResult.abbreviation
  );

  // Create a DateTime from the parsed date in the source timezone
  let sourceDateTime: DateTime;

  try {
    if (parseResult.explicitOffset) {
      // Explicit offset like +05:30 or Z in the text - chrono handles these correctly
      // Just use the date as-is since chrono already adjusted for the offset
      sourceDateTime = DateTime.fromJSDate(parseResult.date);
    } else if (sourceZone === 'local') {
      // Source zone is local (either no explicit TZ in text, or abbreviation mapped to local)
      sourceDateTime = DateTime.fromJSDate(parseResult.date);
    } else {
      // Source zone is an IANA zone or offset (from abbreviation or user settings)
      // Chrono parses times in local, so we need to re-interpret the time components
      // in the actual source zone
      const localDt = DateTime.fromJSDate(parseResult.date);
      const zone = isOffset(sourceZone) ? `UTC${sourceZone}` : sourceZone;
      sourceDateTime = DateTime.fromObject(
        {
          year: localDt.year,
          month: localDt.month,
          day: localDt.day,
          hour: localDt.hour,
          minute: localDt.minute,
          second: localDt.second,
        },
        { zone }
      );
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
    abbreviation: parseResult.abbreviation,
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

