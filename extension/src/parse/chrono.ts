/**
 * Chrono-node parsing wrapper
 * Handles time parsing with offset/abbreviation extraction
 */

import * as chrono from 'chrono-node';
import { TIMEZONE_ABBREVIATIONS } from './timezone';

export interface ChronoParseResult {
  /** The parsed date */
  date: Date;
  /** Original text that was matched */
  matchedText: string;
  /** Start index of the match in the original text */
  startIndex: number;
  /** End index of the match in the original text */
  endIndex: number;
  /** Explicit timezone offset if found (e.g., '+05:30', '-08:00', 'Z') */
  explicitOffset?: string;
  /** Timezone abbreviation if found (e.g., 'PST', 'EST', 'IST') */
  abbreviation?: string;
  /** Whether timezone info was explicitly present in the text */
  hasExplicitTimezone: boolean;
}

// Regex patterns for timezone detection
const OFFSET_PATTERN = /([+-]\d{1,2}:?\d{2}|Z)\s*$/i;
const ABBREV_PATTERN = /\b([A-Z]{2,5}T?)\s*$/i;

/**
 * Parse text for date/time information using chrono-node
 * @param text - The text to parse
 * @param signal - Optional AbortSignal for cancellation
 * @returns Parse result or null if parsing failed
 */
export function parseTime(
  text: string,
  signal?: AbortSignal
): ChronoParseResult | null {
  // Check for cancellation
  if (signal?.aborted) {
    return null;
  }

  // Trim and limit text length
  const trimmedText = text.trim().slice(0, 200);
  if (!trimmedText) {
    return null;
  }

  try {
    // Parse with chrono-node
    const results = chrono.parse(trimmedText);
    
    if (signal?.aborted) {
      return null;
    }

    if (results.length === 0) {
      return null;
    }

    // Take the first result
    const result = results[0];
    const matchedText = result.text;
    
    // Extract timezone information from the matched text
    const { explicitOffset, abbreviation, hasExplicitTimezone } = extractTimezoneInfo(matchedText);

    // Get the parsed date
    const date = result.date();

    return {
      date,
      matchedText,
      startIndex: result.index,
      endIndex: result.index + matchedText.length,
      explicitOffset,
      abbreviation,
      hasExplicitTimezone,
    };
  } catch (error) {
    console.debug('[Time Lens] Parse error:', error);
    return null;
  }
}

/**
 * Extract timezone information from text
 */
function extractTimezoneInfo(text: string): {
  explicitOffset?: string;
  abbreviation?: string;
  hasExplicitTimezone: boolean;
} {
  let explicitOffset: string | undefined;
  let abbreviation: string | undefined;
  let hasExplicitTimezone = false;

  // Check for explicit offset (e.g., +05:30, -08:00, Z)
  const offsetMatch = text.match(OFFSET_PATTERN);
  if (offsetMatch) {
    explicitOffset = normalizeOffset(offsetMatch[1]);
    hasExplicitTimezone = true;
  }

  // Check for timezone abbreviation (e.g., PST, EST, IST)
  if (!explicitOffset) {
    const abbrevMatch = text.match(ABBREV_PATTERN);
    if (abbrevMatch) {
      const potentialAbbrev = abbrevMatch[1].toUpperCase();
      // Verify it's a known abbreviation
      if (TIMEZONE_ABBREVIATIONS[potentialAbbrev]) {
        abbreviation = potentialAbbrev;
        hasExplicitTimezone = true;
      }
    }
  }

  return { explicitOffset, abbreviation, hasExplicitTimezone };
}

/**
 * Normalize an offset string to a consistent format
 */
function normalizeOffset(offset: string): string {
  if (offset.toUpperCase() === 'Z') {
    return '+00:00';
  }
  
  // Remove colon if present and re-add in correct position
  const cleaned = offset.replace(':', '');
  const sign = cleaned[0];
  const hours = cleaned.slice(1, 3).padStart(2, '0');
  const minutes = cleaned.slice(3, 5).padStart(2, '0') || '00';
  
  return `${sign}${hours}:${minutes}`;
}

/**
 * Parse text and return all found date/times
 * Useful for testing or when multiple times might be present
 */
export function parseAllTimes(
  text: string,
  signal?: AbortSignal
): ChronoParseResult[] {
  if (signal?.aborted) {
    return [];
  }

  const trimmedText = text.trim().slice(0, 500);
  if (!trimmedText) {
    return [];
  }

  try {
    const results = chrono.parse(trimmedText);
    
    return results.map((result) => {
      const matchedText = result.text;
      const { explicitOffset, abbreviation, hasExplicitTimezone } = extractTimezoneInfo(matchedText);
      
      return {
        date: result.date(),
        matchedText,
        startIndex: result.index,
        endIndex: result.index + matchedText.length,
        explicitOffset,
        abbreviation,
        hasExplicitTimezone,
      };
    });
  } catch {
    return [];
  }
}

