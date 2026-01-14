/**
 * Time conversion module
 * Converts parsed times to target timezones using Luxon
 */

import { DateTime } from 'luxon';
import type { ParsedTime, ConvertedTime, ParseResult, Settings } from '@/shared/types';
import type { ChronoParseResult } from './chrono';
import { resolveSourceZone, getZoneLabel, isOffset, offsetToMinutes } from './timezone';
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
    parseResult.abbreviation,
    settings,
    origin
  );

  // Create a DateTime from the parsed date in the source timezone
  let sourceDateTime: DateTime;

  try {
    if (isOffset(sourceZone)) {
      // For offset-based zones, create with the offset
      const offsetMinutes = offsetToMinutes(sourceZone);
      sourceDateTime = DateTime.fromJSDate(parseResult.date, { zone: 'UTC' })
        .minus({ minutes: parseResult.date.getTimezoneOffset() })
        .plus({ minutes: offsetMinutes })
        .setZone(`UTC${sourceZone}`);
    } else if (sourceZone === 'local') {
      // Local timezone
      sourceDateTime = DateTime.fromJSDate(parseResult.date);
    } else {
      // IANA timezone - chrono parses in local, so we need to interpret in the source zone
      const localDt = DateTime.fromJSDate(parseResult.date);
      sourceDateTime = DateTime.fromObject(
        {
          year: localDt.year,
          month: localDt.month,
          day: localDt.day,
          hour: localDt.hour,
          minute: localDt.minute,
          second: localDt.second,
        },
        { zone: sourceZone }
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

  // Convert to primary target zone
  const primaryDateTime = convertToZone(sourceDateTime, settings.primaryTargetZone);
  const primary: ConvertedTime = {
    zone: settings.primaryTargetZone,
    label: getZoneLabel(settings.primaryTargetZone),
    formatted: formatTime(primaryDateTime, settings.formatPreset, settings.customFormat),
    isoString: primaryDateTime.toISO() ?? '',
  };

  // Convert to all target zones
  const targets: ConvertedTime[] = settings.targetZones.map((zone) => {
    const targetDateTime = convertToZone(sourceDateTime, zone);
    return {
      zone,
      label: getZoneLabel(zone),
      formatted: formatTime(targetDateTime, settings.formatPreset, settings.customFormat),
      isoString: targetDateTime.toISO() ?? '',
    };
  });

  return {
    parsed,
    local,
    primary,
    targets,
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

// Note: parseAndConvert was removed to avoid circular dependency
// Use parseTime from chrono.ts and convertTime from this module separately
