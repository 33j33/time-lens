/**
 * Chrono-node parsing wrapper
 * Handles time parsing with offset/abbreviation extraction
 */

import * as chrono from 'chrono-node';

export interface ChronoParseResult {
  /** The parsed date */
  date: Date;
  /** Original text that was matched (e.g., "3pm PST", "Jan 15 at 2pm+05:30") */
  matchedText: string;
  /** Start index of the match in the original text */
  startIndex: number;
  /** End index of the match in the original text */
  endIndex: number;
  /** Explicit timezone offset in minutes if found (e.g., 330 for +05:30, -480 for -08:00) */
  timezoneOffsetMinutes?: number;
  /** Whether timezone info was explicitly present in the text */
  hasExplicitTimezone: boolean;
}

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
    
    // Extract timezone information from chrono's parsed result
    const timezoneOffset = result.start.get('timezoneOffset');
    const hasExplicitTimezone = result.start.isCertain('timezoneOffset');
    
    // Store the offset in minutes (as chrono provides it)
    const timezoneOffsetMinutes = (hasExplicitTimezone && timezoneOffset !== undefined && timezoneOffset !== null) 
      ? timezoneOffset 
      : undefined;
    
    console.log('[Time Lens] Chrono parse debug:', {
      matchedText,
      timezoneOffsetMinutes,
      hasExplicitTimezone,
    });

    // Get the parsed date
    const date = result.date();

    return {
      date,
      matchedText,
      startIndex: result.index,
      endIndex: result.index + matchedText.length,
      timezoneOffsetMinutes,
      hasExplicitTimezone,
    };
  } catch (error) {
    console.debug('[Time Lens] Parse error:', error);
    return null;
  }
}


